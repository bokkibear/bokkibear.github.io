$(function() {
	var currentUrl = $("body").attr("data-here");		
	var $nav = $("#nav-dropdown nav");
	
	$nav.find("a[href='" + currentUrl + "']").remove();
	
	$("#nav-dropdown h3").on("click", showDropdown );	
	$("body").on("click", hideDropdown);
	
	function showDropdown() {
		if ( !$nav.attr("data-shown") ) {
			$nav.velocity("slideDown", function() {
				$nav.attr("data-shown", true);
			});				
		}
	}
	
	function hideDropdown() {		
		if ( $nav.attr("data-shown") ) {
			$nav.velocity("slideUp", function() {
				$nav.removeAttr("data-shown");
			});	
		}
	}
	
	if ($nav.swipe) {
		$nav.swipe({
			swipeDown: showDropdown,
			swipeUp: hideDropdown,
			threshold: 0
		});
	}
	
	$(document).unload( function() {
		$nav.css("display", "none");
	});		
	
});

/*------------ GOOGLE ANALYTICS -------------- */
var analyticsIds = {
	"dev.cplions.co.uk": "UA-53771561-1",
	"www.cplions.co.uk": "UA-53771561-2"
}

var forbiddenReferrerDomains = [ "darodar.com" ];

function getAnalyticsId() { 
	if ( isReferrerAllowed(document.referrer) ) {
		var analyticsId = analyticsIds[ document.domain ]; 
		if ( !analyticsId ) {
			console.debug("No analytics ID specified for current domain: " + document.domain + ", no analytics will be reported.");			
		}
		return analyticsId;
	}
	return false;
}

function isReferrerAllowed(referrer) {	
	if ( referrer ) {
		for ( var i=0; i<forbiddenReferrerDomains.length; i++) {
			var forbiddenReferrerDomain = forbiddenReferrerDomains[i];
			if ( referrer.indexOf( forbiddenReferrerDomain ) >= 0 ) {
				console.debug("Referrer " + referrer + " contains forbidden domain " + forbiddenReferrerDomain + " and no analytics will be reported");
				return false;
			}
		}
	}
	return true;
}

var currentAnalyticsId = getAnalyticsId();
if ( currentAnalyticsId ) {
	(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
	  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
	  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
	  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');	  	
} 

var analytics = function() {	
	if ( currentAnalyticsId ) {
		ga.apply( this, arguments );
	}
}

analytics('create', currentAnalyticsId, 'auto');
analytics('send', 'pageview');	


/*------------ MARKDOWN -------------- */
function markdownToLionsHtml( markdownInput ) {
	var markdownTree = markdown.parse( markdownInput + "\n\n[wibble]: http://flibble.net" );    	
	var markdownReferences = markdownTree[1].references;	
	
	var find_link_refs = function( jsonml ) {
	  if ( jsonml[ 0 ] === "link_ref" ) {
		var parsedReference = parseMarkdownReference( jsonml[ 1 ].ref, jsonml[1].original );
		
		if ( parsedReference ) {
		
			markdownReferences[ parsedReference.ref ] = {
				href: parsedReference.url
			};		
			
			jsonml[ 1 ].ref = parsedReference.ref;			
			jsonml[ 2 ] = parsedReference.text;
		}
	  }
	  else if ( Array.isArray( jsonml[ 1 ] ) ) {
		jsonml[ 1 ].forEach( find_link_refs );
	  }
	  else if ( Array.isArray( jsonml[ 2 ] ) ) {
		jsonml[ 2 ].forEach( find_link_refs );
	  }
	}
	
	for ( var i=1; i<markdownTree.length; i++) {
		if ( Array.isArray ( markdownTree[i] ) ) {
			markdownTree[ i ].forEach( find_link_refs );
		}
	}
	
	find_link_refs( markdownTree );
	
	return markdown.renderJsonML( markdown.toHTMLTree( markdownTree ) );
}

function parseMarkdownReference( reference, original ) {
	var split = reference.split('|');
	if ( split.length !== 2 ) return false;
	
	var splitOriginal = original.split('|');
	if ( splitOriginal.length !== 2 ) return false;
	
	return {
		text: splitOriginal[1].substr(0, splitOriginal[1].length - 1),
		ref: split[0],
		url: parseReferenceDestination( split[0] )
	};
}

var destinationDocuments = {
	map: "albion-map.html",
	gallery: "gallery.html",
	temple: "temple.html",
	group: "groups.html"
};

function parseReferenceDestination( destination ) {
	var split = destination.split(':');
	if ( split.length !== 2 ) return false;
	if ( split[0] === "http" || split[0] === "https" ) return destination;
	return destinationDocuments[ split[0] ] + "#" + split[1];
}
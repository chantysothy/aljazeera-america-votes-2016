var computed_class = 'none';
var dataSource = {
  presidentialSummary: "assets/data/20160727_141451_WebExport_PresidentialSummary.json", 
  races: "assets/data/20160727_141451_WebExport_Races.json", 
  senateSummary: "assets/data/20160727_141451_WebExport_SenateSummary.json",
  houseSummary: "assets/data/20160727_141451_WebExport_HouseSummary.json",
  governorSummary: "assets/data/20160727_141451_WebExport_GovernorSummary.json"
};

var avatarVar = [];
var evTotal = 270;

var candidates = {
  'hc':{
    'electoralVotes': '#hc-electwon',
    'popularVotes': '#hc-popvote',
    'popularVotePercentage': '#hc-poppct',
    'avatar_selector': '#aj-ahc',
    'color': '#073D7D',
    'evSelector' : '#hc-electwon',
    'pvSelector' : '#hc-popvote',
    'pvpSelector' : '#hc-poppct'
  },
  'dt':{
    'electoralVotes': '#dt-electwon',
    'popularVotes': '#dt-popvote',
    'popularVotePercentage': '#dt-poppct',
    'avatar_selector': '#aj-adt',
    'color': '#B40010',
    'evSelector' : '#dt-electwon',
    'pvSelector' : '#dt-popvote',
    'pvpSelector' : '#dt-poppct'
  }
};

var senateTotal = 100;
var senate = {

  rep: {
    label: 'REPUBLICANS',
    count: 30,
    color: '#CC0000',
    selector: '#aj-s-rep',
    won: 0
  },
  ufc: {
    label: 'UP FOR CONTEST',
    count: 34,
    color: '#666666',
    selector: '#aj-s-ufc',
    won: 0
  },
  ind: {
    label: 'IND.',
    count: 2,
    color: '#FF6600',
    selector: '#aj-s-ind',
    won: 0
  },
  dem: {
    label: 'DEMOCRATS',
    count: 34,  
    color: '#3399CC',
    selector: '#aj-s-dem',
    won: 0
  },
};


$(document).ready(function(){

jQuery.ajaxSetup({async:false});

  //console.log(getWinnerClass('WA'));
  generateTilegram(0.7);
  generateAvatarPieChart(avatarVar, candidates);
  populateSenateSVG();
  populateSenate(senate, senateTotal);
  
  /* fetch data from data source and populate elements */
  $.getJSON(dataSource.presidentialSummary, function(data){
    
    populateAvatarPieChart(data.Candidates);    
    populatePresResTable(data.Candidates);

  });

});

/* generateTilegram */
function generateTilegram(scale){

  var tilegram_json = 'assets/data/pitch-electoral-college.json';

  // dimensions

  var width = $('.svg-container').width();
  //console.log(width);
  var height = $('.svg-container').width()/1.8;


  var electors = []
  d3.csv("assets/data/num-electors-by-state.csv", function(data) {

    data.forEach(function(d) {

      electors.push([d.State, d.Electors]);

    });
     
     //console.log(electors);
  });
  //console.log(height);
  //var scale = 0.7;

  $('.svg-container').css({'padding-bottom': height});

  // svg configuration
  var svg = d3.select('.svg-container').append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('id', "map")
    .classed("svg-content", true)
    //.attr('viewBox', "0 0 "+width+" "+height+"")
    .attr('viewBox', "0 0 1280 800")
    .attr('perserveAspectRatio', "xMinYMid meet");

  // traverse topojson and generate svg
  d3.json(tilegram_json, function showData(error, tilegram) {

    var tiles = topojson.feature(tilegram, tilegram.objects.tiles);

    var stateCodes = [];

    tilegram.objects.tiles.geometries.forEach(function(geometry) {
      if (stateCodes.indexOf(geometry.properties.state) === -1) {
        stateCodes.push(geometry.properties.state);
      }
    });

    var transform = d3.geoTransform({
      point: function(x, y) {
        this.stream.point(x, -y);
      }
    });

    var path = d3.geoPath().projection(transform);

    var g = svg.append('g')
      //.attr('transform', 'translate(0,'+ height +')')
      .attr('transform', 'translate(0, 750)')
      .attr('id', 'g-container');


    g.selectAll('.tiles')
      .data(tiles.features)
      .enter().append('path')
      .attr('d', path)
      .attr("state_id", function(d) {
             return d.id
         })
      .attr("state", function(d) {
             return d.properties.state
         })
      .attr("class", function(d){
            //console.log('inside anony func: '+d.properties.state);
            //console.log('inside anony func: '+d.properties.state+' /'+getWinnerClass(d.properties.state));
            return 'tile '+ getWinnerClass(d.properties.state)
      })
      .attr("transform", "scale("+scale+")")
      .on("click", click);


    // Build merged geometry for each state
    var stateBorders = stateCodes.map(function(code) {

      var feature = topojson.merge(
        tilegram,
        tilegram.objects.tiles.geometries.filter(function(geometry) {
          return geometry.properties.state === code
        })
      )
      feature.properties = {state: code}
      return feature
    });

    // Group for state boundary and label
    var stateGroup = g.selectAll("g.state-boundary")
      .data(stateBorders)
      .enter().append("g")

    stateGroup.
      append("path")
      .attr('d', path)
      .attr('class', 'state-boundary')
      .attr('fill', 'none')
      .attr("transform", "scale("+scale+")")

    stateGroup
      .append("circle")
      .attr('class', 'state-label-container')
      .attr('r', 18)
      .attr("transform", function(feature) {
        var center = path.centroid(feature)
        //console.log(center);
        if (feature.properties.state === "LA") {
          //center[1] += 0
          center[0] -= 14
        }

        if (feature.properties.state === "AZ") {
          center[1] += 60
          center[0] += 5
        }

        if (feature.properties.state === "NM") {
          center[1] += 10
          center[0] += 8
        }

        if (feature.properties.state === "OR") {
          center[1] += 7
          
        }

        if (feature.properties.state === "MS") {
          center[0] -= 7
          
        }

        if (feature.properties.state === "NV") {
          center[0] -= 3
          
        }

        if (feature.properties.state === "UT") {
          center[0] += 12
          center[1] += 27
          
        }

        if (feature.properties.state === "CO") {
          center[0] += 6
          
          
        }

        if (feature.properties.state === "ID") {
          center[0] += 6
          
          
        }

        if (feature.properties.state === "WY") {
          center[0] += 15
          center[1] += 7
          
          
        }

        if (feature.properties.state === "MT") {
          center[1] -= 5
          center[0] += 8
        }

        if (feature.properties.state === "MN") {
          center[0] -= 15
          
        }

        if (feature.properties.state === "ME") {
          center[0] += 7
          
        }

        if (feature.properties.state === "NH") {
          center[0] -= 6
          
        }

        if (feature.properties.state === "VT") {
          center[0] += 0
          center[1] += 6
          
        }

        if (feature.properties.state === "DE") {
          center[0] += 0
          center[1] += 6
          
        }

        if (feature.properties.state === "DC") {
          center[0] -= 13
          center[1] += 6
          
        }

        if (feature.properties.state === "MD") {
          center[0] += 0
          center[1] -= 28
          
        }

        if (feature.properties.state === "HI") {
          center[0] -= 11
          center[1] -= 13
          
        }

        return "scale("+scale+") translate(" + (center[0]) + ", " + (center[1]-7) + ")"
      })
      .attr("stroke", "#fff")
      .attr("fill", "#fff")

    stateGroup
      .append("text")
      .attr('class', 'state-label')
      .text(function(feature) {
        return feature.properties.state;
      })
      .attr("transform", function(feature) {
        var center = path.centroid(feature)
        if (feature.properties.state === "LA") {
          center[1] += 0
          center[0] -= 14
        }

        if (feature.properties.state === "AZ") {
          center[1] += 60
          center[0] += 5
        }

        if (feature.properties.state === "NM") {
          center[1] += 10
          center[0] += 8
        }

        if (feature.properties.state === "OR") {
          center[1] += 7
          
        }

        if (feature.properties.state === "MS") {
          center[0] -= 7
          
        }

        if (feature.properties.state === "NV") {
          center[0] -= 3
          
        }

        if (feature.properties.state === "UT") {
          center[0] += 12
          center[1] += 27
          
        }

        if (feature.properties.state === "CO") {
          center[0] += 6
          
          
        }

        if (feature.properties.state === "ID") {
          center[0] += 6
          
          
        }

        if (feature.properties.state === "WY") {
          center[0] += 15
          center[1] += 7
          
          
        }

        if (feature.properties.state === "MT") {
          center[1] -= 5
          center[0] += 8
      
        }
        if (feature.properties.state === "MN") {
          center[0] -= 15
          
        }

        if (feature.properties.state === "ME") {
          center[0] += 6
          
        }

        if (feature.properties.state === "NH") {
          center[0] -= 6
          
        }

        if (feature.properties.state === "VT") {
          center[0] += 0
          center[1] += 6
          
        }

        if (feature.properties.state === "DE") {
          center[0] += 0
          center[1] += 6
          
        }

        if (feature.properties.state === "DC") {
          center[0] -= 13
          center[1] += 6
          
        }

        if (feature.properties.state === "MD") {
          center[0] += 0
          center[1] -= 28
          
        }

        if (feature.properties.state === "HI") {
          center[0] -= 11
          center[1] -= 13
          
        }
        
        //return "scale(0.5) translate(" + center[0] + ", " + center[1] + ")"
        return "scale("+scale+") translate(" + center[0] + ", " + center[1] + ")"
      })
      .attr("text-anchor", "middle")






  });

    

}
/* end generateTilegram */


/* click */
function click(a){

  console.log($(this).attr('state')+' clicked');

  if($('.state-label').css("visibility") === 'hidden')
  {
    $('.state-label').css({"visibility":"visible"});
    $('.state-label-container').css({"visibility":"visible"});
  }
  else if($('.state-label').css("visibility") === 'visible')
  {
    $('.state-label').css({"visibility":"hidden"});
    $('.state-label-container').css({"visibility":"hidden"});
  }

}
/* end click */


/* get winner party */

function getWinnerClass(state){
  
  var computed_party;

  $.getJSON(dataSource.races, function(data){
    
    $.each(data.Race, function(index, value){

       if((value.TypeId === 'G') && (value.OfficeId === 'P') && (value.Released === true) && (value.StatePostal === state))
      {
          computed_party = value.hasOwnProperty('WinningParty') ? value.WinningParty : 'none';          
          //console.log(computed_party);

          if(computed_party === 'GOP')
          {
            //console.log('apply color GOP to '+value.StatePostal+'. ElectoralVotes GOP='+value.Candidates[0].ElectoralVotes+' DEM='+value.Candidates[1].ElectoralVotes)
            computed_class = 'rep';
            
          }
          
          else if(computed_party === 'DEM')
          {
            //console.log('apply color DEM to '+value.StatePostal+'. ElectoralVotes DEM='+value.Candidates[0].ElectoralVotes+' GOP='+value.Candidates[1].ElectoralVotes)
            computed_class = 'dem';

          }

          else{
            computed_class = 'none';
          }
      }

    });
    
  });

  //console.log(computed_class);
  return computed_class;

}

/* end function */

/* populate senate svg chart */
function populateSenateSVG(){

  var won = 0;

  $.getJSON(dataSource.senateSummary, function(data){

    $.each(data.Parties, function(index, value){
      
      won = won + parseInt(value.Won);
    
    });

    if(won <= 34){

      $.each(data.Parties, function(index, value){
      
        //console.log(value.Party);
        if(value.Party === 'DEM')
        {
          //console.log('DEM: '+ value.Won);
          //$( ".ufcp" ).attr( "fill", senate.dem.color );
          senate.dem.count = parseInt(senate.dem.count) + parseInt(value.Won);
          senate.dem.won = parseInt(value.Won);
          //console.log(senate.dem.color);
          //$(".ufcp").slice(0, value.Won).addClass("ufcp-d");
          
        }

        if(value.Party === 'GOP')
        {
          //console.log('GOP: '+ senate.dem.won);
          senate.rep.count = parseInt(senate.rep.count) + parseInt(value.Won);
          senate.rep.won = parseInt(value.Won);
          //$(".ufcp").slice(parseInt(senate.dem.won), parseInt(senate.dem.won) + parseInt(value.Won)).addClass("ufcp-r");
          //$(".ufcp").addClass("ufcp-r");
         
        }

        if(value.Party === 'OTHERS')
        {
          console.log('OTHERS: '+ value.Won);
          senate.ind.count = parseInt(senate.ind.count) + parseInt(value.Won);
          senate.ind.won = parseInt(value.Won);

          //$(".ufcp").slice(senate.dem.won+senate.rep.won, value.Won).addClass("ufcp-i");
          //$(".ufcp").slice(parseInt(senate.dem.won), parseInt(senate.dem.won) + parseInt(value.Won)).addClass("ufcp-r");
        }
          
      
      });

      senate.ufc.count = 100 - senate.dem.count - senate.rep.count - senate.ind.count;

      $(".ufcp").slice(0, senate.dem.won).addClass("ufcp-d");
      $(".ufcp").slice(34 - senate.rep.won, 34).addClass("ufcp-r");
      $(".ufcp").slice(senate.dem.won, senate.dem.won + senate.ind.won).addClass("ufcp-i");
      //$(".ufcp").slice(senate.dem.won, senate.dem.won + senate.ind.won).addClass("ufcp-i");
      //$(".ufcp").slice(senate.dem.won + senate.rep.won, senate.dem.won + senate.rep.won + senate.rep.won).addClass("ufcp-i");

      //console.log(senate);

    }

    


  });

}


/* populate senate stacked bar chart */
function populateSenate(senate, senateTotal){

  /* !!!!!!!!!! fetch data from senate object !!!!!!!!!!!! */


  $.each(senate, function(index, element) {
      
      $(element.selector+' .aj-s-label').text(element.label).css('color', element.color);
      $(element.selector).width(((element.count/senateTotal)*100)+"%");
      $(element.selector+' .aj-s-count').text(element.count).css('color', element.color);
      $(element.selector+' .aj-s-bar').css('background', element.color);

  });
}
/* end function */

/* generate avatar pie chart */
function generateAvatarPieChart(avatarVar, candidates){

  $.each(candidates, function(index, element) {
      
   avatarVar[index] = new ProgressBar.Circle(element.avatar_selector, {
      strokeWidth: 5,
      easing: 'easeInOut',
      duration: 1000,
      color: element.color,
      trailColor: '#BCBCBC',
      trailWidth: 5,
      svgStyle: null,
      width: 150
    });

  });

}
/* end function */

/* populate avatar pie chart */
function populateAvatarPieChart(data){

  var demIndex = findWithAttr(data, 'Party', 'DEM');
  var gopIndex = findWithAttr(data, 'Party', 'GOP');

  avatarVar['hc'].animate((data[demIndex].ElectWon/evTotal > 1) ? 1 : data[demIndex].ElectWon/evTotal);
  avatarVar['dt'].animate((data[gopIndex].ElectWon/evTotal > 1) ? 1 : data[gopIndex].ElectWon/evTotal);

}
/* end function */

/* populate presential results table */
function populatePresResTable(data){

  var demIndex = findWithAttr(data, 'Party', 'DEM');
  var gopIndex = findWithAttr(data, 'Party', 'GOP');

  // hillary
  $(candidates['hc'].evSelector).text(data[demIndex].ElectWon);
  $(candidates['hc'].pvSelector).text(data[demIndex].PopVote.toLocaleString());
  $(candidates['hc'].pvpSelector).html(data[demIndex].PopPct+"<span class='pct'>%</span>");
  // donald
  $(candidates['dt'].evSelector).text(data[gopIndex].ElectWon);
  $(candidates['dt'].pvSelector).text(data[gopIndex].PopVote.toLocaleString());
  $(candidates['dt'].pvpSelector).html(data[gopIndex].PopPct+"<span class='pct'>%</span>");

}

/* helper functions */
function findWithAttr(array, attr, value){

    for(var i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}


//var senateSeats = $('.snp');

//console.log(senateSeats.length);


$( window ).resize(function() {
  
  //console.log($( window ).width() + " x " + $( window ).height())
  //var width = $(window).width();
  var height = $('.svg-container').width()/1.8;
  //var height = $("#g-container").height();

  //var el   = document.getElementById("g-container"); // or other selector like querySelector()
  //var rect = el.getBoundingClientRect();

  //console.log(rect.height);
  $('svg#map').attr("height", parseInt(height));
  $('.svg-container').css({'padding-bottom': parseInt(height)})

  //$("svg#map").removeAttr("viewBox")
  //$('svg#map').attr("viewBox", "0 0 "+width+" "+windowSize)

});
//.css({'fill':'#000'});



/* pull to refresh */
window.onload = function() {
    WebPullToRefresh.init( {
        loadingFunction: exampleLoadingFunction
    } );
};

// Just an example loading function that returns a
// promise that WebPullToRefresh can use.
var exampleLoadingFunction = function() {
    return new Promise( function( resolve, reject ) {
        // Run some async loading code here

        if ( true /* if the loading worked */ ) {
            console.log('success');
            resolve();
        } else {
            reject();
        }
    } );
};
/* pull to refresh */


    
$(function () {

  if (window.location.host == 'localhost') {
    var base = '/covidmoris/';
  } else {
    var base = '/';
  }
  
  if (matches = window.location.pathname.match(/(jhu)$/)) {
    var datasource = matches[1];
  } else {
    var datasource = 'besafemoris';
  }
  $('#'+datasource).removeClass('btn-secondary').addClass('btn-primary');
  collectData(datasource);
  $('.btn-group .btn').click(function () {
    $('.btn-group .btn-primary').removeClass('btn-primary').addClass('btn-secondary');
    $(this).removeClass('btn-secondary').addClass('btn-primary');
    datasource = $(this).attr('id');
    history.pushState(datasource, window.title, base + datasource)
    collectData(datasource);
    trackView();
  });
  $(window).on('popstate', function (e) {
    $('.btn-group .btn-primary').removeClass('btn-primary').addClass('btn-secondary');
    $('#'+event.state).removeClass('btn-secondary').addClass('btn-primary');
    collectData(event.state);
    trackView();
  });


  function trackView() {
    _paq.push(['setCustomUrl', window.location.pathname]);
    _paq.push(['trackPageView']);
  }
});

function collectData(datasource) {

  // variables
  var _labels = [], cases2021 = [], labels2021 = [], cases2020 = [], labels2020 = [];
  var start2021 = moment('2021-03-05');
  var start2020 = moment('2020-03-18');
  var end2020 = moment('2020-05-10');

  $('#main').html('<div class="d-flex justify-content-center"><div class="spinner-border" role="status"><span class="sr-only">Loading...</span></div></div>');

  // collect data

  if (datasource == 'besafemoris') {
    $('#source_attribution').html('&copy; <a href="https://besafemoris.mu/">beSafeMoris, Mauritius Telecom Ltd &amp; Ministry of Health and Wellness</a> (<a href="https://besafemoris.mu/terms-of-use/">terms of use</a>)');

    var start2021_fmt = start2021.format('DD/MM/YYYY'), end2020_fmt = end2020.format('DD/MM/YYYY');

    $.ajax({
      url: 'https://besafemoris.mu/wp-json/wp/v2/getLocalCases/?is_mobile=1&from=2020-03-04&to='+moment().format('YYYY-MM-DD'),
      cache: true,
      jsonp: "_jsonp",
      dataType: 'jsonp'
    }).done(function (response) {
      var data = response.cases, i = 0;
      if (!data) {
        $('#main').html('<p class="text-danger text-center"><strong>Ohoh looks like beSafeMoris changed their data, please wait until I update the code.</strong></p>');
        return;
      }
      data.sort(function (a, b) {
        if (moment(a.case_date, 'DD/MM/YYYY').isAfter(moment(b.case_date, 'DD/MM/YYYY'))) {
          return -1;
        } else {
          return 1;
        }
      });
      do {
        day = data.shift();
        cases2021.unshift(day.active_cases - 19); // we have 19 ppl I don't know where they come from
        labels2021.unshift(day.case_date);
      } while(day.case_date != start2021_fmt);
      i = 0;
      do {
        day = data.pop();
        cases2020.push(day.active_cases);
        labels2020.push(day.case_date);
      } while(day.case_date != end2020_fmt);
      var start_date = moment(start2021);
      for (i = 0; i < Math.max(labels2020.length, labels2021.length); i++) {
        _labels.push(start_date.format('D/MM/YY'));
        start_date.add(1, 'day');
      }

      drawChart();
    }).fail(function () {
      $('#main').html('<p class="text-danger text-center"><strong>Ohoh couldn’t retrieve data</strong></p>');
    });


  } else {
    $('#source_attribution').html('&copy; 2020 <a href="https://github.com/CSSEGISandData/COVID-19">Johns Hopkins University CSSE COVID-19 Data</a> (license: <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>)');

    $.ajax({
      url: 'https://api.covid19api.com/country/mauritius?from='+moment(start2020).add(-1, 'day').toISOString()+'&to='+moment().startOf('day').toISOString(),
      cache: true,
      dataType: 'json'
    }).done(function (response) {
      var data = response, i = 0;
      if (!data) {
        $('#main').html('<p class="text-danger text-center"><strong>Ohoh looks like we can’t retrieve the data, please try again later.</strong></p>');
        return;
      }
      do {
        day = data.pop();
        day.Date = moment(day.Date);
        // normalize data because 2021-03-07 went wild
        if (i > 0 && ((day.Active - last_day.Active) / last_day.Active) > 3) {
          day.Active = last_day.Active;
        }
        cases2021.unshift(day.Active - 19);
        labels2021.unshift(day.Date.format('D/MM/YYYY'));
        last_day = day;
        i++;
      } while(!day.Date.isSame(start2021, 'day'));
      i = 0;
      do {
        day = data.shift();
        day.Date = moment(day.Date);
        cases2020.push(day.Active);
        labels2020.push(day.Date.format('D/MM/YYYY'));
        i++;
      } while(!day.Date.isSame(end2020, 'day'));
      start_date = moment(start2021);
      for (i = 0; i < Math.max(labels2020.length, labels2021.length); i++) {
        _labels.push(start_date.format('D/MM/YY'));
        start_date.add(1, 'day');
      }

      drawChart();
    }).fail(function () {
      $('#main').html('<p class="text-danger text-center"><strong>Ohoh looks like we can’t retrieve the data, please try again later</strong></p>');
    });
  }

  function drawChart() {


    // draw the chart

    $('#main').html('<canvas id="chart" width="400" height="200"></canvas>');
    var ctx = document.getElementById('chart').getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: _labels,
          datasets: [
            {
                label: '2021 active cases',
                borderColor: 'rgb(242, 94, 95)',
                data: cases2021,
                labels: labels2021,
                borderWidth: 2
            },
            {
                label: '2020 active cases',
                borderColor: 'rgb(75, 192, 192)',
                data: cases2020,
                labels: labels2020,
                borderWidth: 2
            }
          ]
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        showLine: true,
        onResize: function (chart) {
          if ($(window).width() < 768) {
            chart.resize(chart.width, chart.width);
          } else {
            chart.resize(chart.width, chart.width / 2);
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
                title: function(context) {
                    return context[0].dataset.labels[context[0].dataIndex];
                },
                label: function(context) {
                    return context.parsed.y+' active case';
                }
            }
          }
        },
        elements: {
          point:{
            radius: 2
          }
        },
        parsing: {
            xAxisKey: 'day',
            yAxisKey: 'cases'
        }
      }
    });
  }
}
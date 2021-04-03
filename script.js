$(function () {

  // collect data

  $.ajax({
    url: (window.location.host == 'localhost') ? 'api/cases.json' : 'https://covidmoris.julienmru.workers.dev/',
    cache: true,
    dataType: 'json'
  }).done(function (data) {
    var cases2021 = [], labels2021 = [], i = 0;
    do {
      day = data.shift();
      cases2021.unshift(day.active_cases);
      labels2021.unshift(day.case_date);
    } while(day.case_date != '05/03/2021');
    var cases2020 = [], labels2020 = []; i = 0;
    do {
      day = data.pop();
      cases2020.push(day.active_cases);
      labels2020.push(day.case_date);
    } while(day.case_date != '10/05/2020');
    var _labels = labels2021;
    for (i = labels2021.length; i < labels2020.length; i++) {
      _labels.push(labels2020[i]);
    }

    // draw the chart

    $('#main').html('<canvas id="chart" width="400" height="200"></canvas>');
    var ctx = document.getElementById('chart').getContext('2d');
    var myChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: _labels,
          datasets: [{
              label: '2020 outbreak',
              borderColor: 'rgb(75, 192, 192)',
              data: cases2020,
              borderWidth: 2
          },
          {
              label: '2021 outbreak',
              borderColor: 'rgb(242, 94, 95)',
              data: cases2021,
              borderWidth: 2
          }]
      },
      options: {
        responsive: true,
        showLine: true,
        plugins: {
          tooltip: {
            enabled: false
          }
        },
        parsing: {
            xAxisKey: 'day',
            yAxisKey: 'cases'
        }
      }
    });
  }).fail(function () {
    $('#main').html('<p class="text-danger text-center"><strong>Ohoh couldn’t retrieve data</strong></p>');
  });
});
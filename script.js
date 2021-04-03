$(function () {

  // variables
  var start2021 = moment('2021-03-05');
  var end2020 = moment('2020-05-10');

  // collect data

  var start2021_fmt = start2021.format('DD/MM/YYYY'), end2020_fmt = end2020.format('DD/MM/YYYY');

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
    } while(day.case_date != start2021_fmt);
    var cases2020 = [], labels2020 = []; i = 0;
    do {
      day = data.pop();
      cases2020.push(day.active_cases);
      labels2020.push(day.case_date);
    } while(day.case_date != end2020_fmt);
    var _labels = [], start_date = moment(start2021);
    for (i = 0; i < Math.max(labels2020.length, labels2021.length); i++) {
      _labels.push(start_date.format('D/MM/YY'));
      start_date.add(1, 'day');
    }

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
            radius: 1
          }
        },
        parsing: {
            xAxisKey: 'day',
            yAxisKey: 'cases'
        }
      }
    });
    $(window).on('resize', function () {
      if ($(window).width() < 768) {
        myChart.resize(myChart.width, myChart.width);
      } else {
        myChart.resize(myChart.width, myChart.width / 2);
      }
    }).trigger('resize');
  }).fail(function () {
    $('#main').html('<p class="text-danger text-center"><strong>Ohoh couldn’t retrieve data</strong></p>');
  });
});
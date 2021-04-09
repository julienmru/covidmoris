$(function () {

  // variables
  var start2021 = moment('2021-03-05');
  var start2020 = moment('2020-03-18');
  var end2020 = moment('2020-05-10');

  // collect data

  var start2021_fmt = start2021.format('DD/MM/YYYY'), end2020_fmt = end2020.format('DD/MM/YYYY');

  $.ajax({
    url: 'https://api.covid19api.com/country/mauritius?from='+moment(start2020).add(-1, 'day').toISOString()+'&to='+moment().startOf('hour').toISOString(),
    cache: true,
    dataType: 'json'
  }).done(function (response) {
    var data = response, cases2021 = [], labels2021 = [], i = 0;
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
      cases2021.unshift(day.Active);
      labels2021.unshift(day.Date.format('D/MM/YYYY'));
      last_day = day;
      i++;
    } while(!day.Date.isSame(start2021, 'day'));
    var cases2020 = [], labels2020 = []; i = 0;
    do {
      day = data.shift();
      console.log(day);
      day.Date = moment(day.Date);
      cases2020.push(day.Active);
      labels2020.push(day.Date.format('D/MM/YYYY'));
      i++;
    } while(!day.Date.isSame(end2020, 'day'));
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
  }).fail(function () {
    $('#main').html('<p class="text-danger text-center"><strong>Ohoh looks like we can’t retrieve the data, please try again later</strong></p>');
  });
});
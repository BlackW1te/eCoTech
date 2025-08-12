// Kullanıcı kontrolü
    function checkAuth() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      
      document.getElementById('userName').textContent = user.first_name + ' ' + user.last_name;
    }

    // Dashboard verilerini yükle
    async function loadDashboard() {
      try {
        const response = await fetch('api/carbon_calculation.php?action=history');
        const data = await response.json();
        
        if (data.success) {
          updateStatistics(data.data.statistics);
          updateRecentCalculations(data.data.calculations);
          createChart(data.data.calculations);
        }
      } catch (error) {
        console.error('Dashboard yükleme hatası:', error);
      }
    }

    // İstatistikleri güncelle
    function updateStatistics(stats) {
      document.getElementById('totalCalculations').textContent = stats.total_calculations || 0;
      document.getElementById('avgFootprint').textContent = Math.round(stats.average_footprint || 0);
      document.getElementById('totalFootprint').textContent = Math.round(stats.total_footprint || 0);
      document.getElementById('monthlyAvg').textContent = Math.round(stats.average_footprint || 0);
    }

    // Son hesaplamaları güncelle
    function updateRecentCalculations(calculations) {
      const tbody = document.getElementById('recentCalculations');
      tbody.innerHTML = '';
      
      calculations.slice(0, 5).forEach(calc => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date(calc.calculation_date).toLocaleDateString('tr-TR')}</td>
          <td><strong>${Math.round(calc.total_carbon_footprint)} kg</strong></td>
          <td>${Math.round(calc.electricity_usage)} kg</td>
          <td>${Math.round(calc.natural_gas_usage)} kg</td>
          <td>${Math.round(calc.water_usage)} kg</td>
          <td>${Math.round(calc.waste_production)} kg</td>
          <td>${Math.round(calc.transportation)} kg</td>
          <td>${calc.notes || '-'}</td>
        `;
        tbody.appendChild(row);
      });
    }

    // Grafik oluştur
    function createChart(calculations) {
      const ctx = document.getElementById('carbonChart').getContext('2d');
      
      // Mevcut grafiği temizle
      if (window.carbonChart) {
        window.carbonChart.destroy();
      }
      
      const labels = calculations.slice(0, 10).reverse().map(calc => 
        new Date(calc.calculation_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
      );
      
      const data = calculations.slice(0, 10).reverse().map(calc => 
        Math.round(calc.total_carbon_footprint)
      );
      
      window.carbonChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Karbon Ayak İzi (kg CO₂e)',
            data: data,
            borderColor: '#10bc69',
            backgroundColor: 'rgba(16, 188, 105, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#10bc69',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#10bc69',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: 'rgba(0,0,0,0.1)',
                drawBorder: false
              },
              ticks: {
                color: '#666666',
                font: {
                  size: 12
                }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                color: '#666666',
                font: {
                  size: 12
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'index'
          },
          elements: {
            point: {
              hoverBackgroundColor: '#10bc69'
            }
          }
        }
      });
    }

    // Rapor indir
    function downloadReport() {
      // Basit CSV raporu oluştur
      const user = JSON.parse(localStorage.getItem('user'));
      const data = `Tarih,Toplam CO₂e (kg),Elektrik,Doğal Gaz,Su,Atık,Ulaşım\n`;
      
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `karbon_raporu_${user.username}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }

    // Çıkış yap
    function logout() {
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }

    // Sayfa yüklendiğinde
    document.addEventListener('DOMContentLoaded', function() {
      checkAuth();
      loadDashboard();
    });
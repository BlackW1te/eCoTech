let currentPage = 1;
    let totalPages = 1;
    let calculations = [];
    let filteredCalculations = [];
    const itemsPerPage = 10;

    // Kullanıcı kontrolü
    function checkAuth() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        window.location.href = 'login.html';
        return;
      }
      
      document.getElementById('userName').textContent = user.first_name + ' ' + user.last_name;
    }

    // Geçmiş verilerini yükle
    async function loadHistory() {
      try {
        const response = await fetch('api/carbon_calculation.php?action=history');
        const data = await response.json();
        
        if (data.success) {
          calculations = data.data.calculations;
          filteredCalculations = [...calculations];
          
          updateStatistics(data.data.statistics);
          updateTable();
          createCharts();
        }
      } catch (error) {
        console.error('Geçmiş yükleme hatası:', error);
      }
    }

    // İstatistikleri güncelle
    function updateStatistics(stats) {
      document.getElementById('totalCalculations').textContent = stats.total_calculations || 0;
      document.getElementById('avgFootprint').textContent = Math.round(stats.average_footprint || 0);
      document.getElementById('totalFootprint').textContent = Math.round(stats.total_footprint || 0);
      document.getElementById('monthlyAvg').textContent = Math.round(stats.average_footprint || 0);
    }

    // Tabloyu güncelle
    function updateTable() {
      const tbody = document.getElementById('calculationsTable');
      tbody.innerHTML = '';
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const pageData = filteredCalculations.slice(startIndex, endIndex);
      
      pageData.forEach(calc => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date(calc.calculation_date).toLocaleDateString('tr-TR')}</td>
          <td><span class="badge badge-carbon">${Math.round(calc.total_carbon_footprint)} kg</span></td>
          <td>${Math.round(calc.electricity_usage)} kg</td>
          <td>${Math.round(calc.natural_gas_usage)} kg</td>
          <td>${Math.round(calc.water_usage)} kg</td>
          <td>${Math.round(calc.waste_production)} kg</td>
          <td>${Math.round(calc.transportation)} kg</td>
          <td>${calc.notes || '-'}</td>
          <td>
            <button class="btn btn-sm btn-outline-info" onclick="viewDetails(${calc.id})">
              <i class="bi bi-eye"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
      
      updatePagination();
    }

    // Sayfalamayı güncelle
    function updatePagination() {
      totalPages = Math.ceil(filteredCalculations.length / itemsPerPage);
      
      document.getElementById('paginationInfo').textContent = 
        `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredCalculations.length)} / ${filteredCalculations.length} kayıt`;
      
      document.getElementById('pageInfo').textContent = `Sayfa ${currentPage} / ${totalPages}`;
      
      document.getElementById('prevBtn').disabled = currentPage === 1;
      document.getElementById('nextBtn').disabled = currentPage === totalPages;
    }

    // Önceki sayfa
    function previousPage() {
      if (currentPage > 1) {
        currentPage--;
        updateTable();
      }
    }

    // Sonraki sayfa
    function nextPage() {
      if (currentPage < totalPages) {
        currentPage++;
        updateTable();
      }
    }

    // Filtreleri uygula
    function applyFilters() {
      const startDate = document.getElementById('startDate').value;
      const endDate = document.getElementById('endDate').value;
      const sortOrder = document.getElementById('sortOrder').value;
      
      filteredCalculations = calculations.filter(calc => {
        const calcDate = new Date(calc.calculation_date);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;
        
        if (start && calcDate < start) return false;
        if (end && calcDate > end) return false;
        
        return true;
      });
      
      // Sıralama
      filteredCalculations.sort((a, b) => {
        switch (sortOrder) {
          case 'asc':
            return new Date(a.calculation_date) - new Date(b.calculation_date);
          case 'desc':
            return new Date(b.calculation_date) - new Date(a.calculation_date);
          case 'footprint_asc':
            return a.total_carbon_footprint - b.total_carbon_footprint;
          case 'footprint_desc':
            return b.total_carbon_footprint - a.total_carbon_footprint;
          default:
            return 0;
        }
      });
      
      currentPage = 1;
      updateTable();
    }

    // Filtreleri sıfırla
    function resetFilters() {
      document.getElementById('startDate').value = '';
      document.getElementById('endDate').value = '';
      document.getElementById('sortOrder').value = 'desc';
      
      filteredCalculations = [...calculations];
      currentPage = 1;
      updateTable();
    }

    // Grafikleri oluştur
    function createCharts() {
      createHistoryChart();
      createPieChart();
      createMonthlyChart();
    }

    // Ana trend grafiği
    function createHistoryChart() {
      const ctx = document.getElementById('historyChart').getContext('2d');
      
      // Mevcut grafiği temizle
      if (window.historyChart) {
        window.historyChart.destroy();
      }
      
      const labels = calculations.slice(0, 20).reverse().map(calc => 
        new Date(calc.calculation_date).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
      );
      
      const data = calculations.slice(0, 20).reverse().map(calc => 
        Math.round(calc.total_carbon_footprint)
      );
      
      window.historyChart = new Chart(ctx, {
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
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 2.5,
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
          }
        }
      });
    }

    // Pasta grafiği
    function createPieChart() {
      const ctx = document.getElementById('pieChart').getContext('2d');
      
      // Mevcut grafiği temizle
      if (window.pieChart) {
        window.pieChart.destroy();
      }
      
      const totalElectricity = calculations.reduce((sum, calc) => sum + calc.electricity_usage, 0);
      const totalGas = calculations.reduce((sum, calc) => sum + calc.natural_gas_usage, 0);
      const totalWater = calculations.reduce((sum, calc) => sum + calc.water_usage, 0);
      const totalWaste = calculations.reduce((sum, calc) => sum + calc.waste_production, 0);
      const totalTransport = calculations.reduce((sum, calc) => sum + calc.transportation, 0);
      
      window.pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Elektrik', 'Doğal Gaz', 'Su', 'Atık', 'Ulaşım'],
          datasets: [{
            data: [totalElectricity, totalGas, totalWater, totalWaste, totalTransport],
            backgroundColor: [
              '#10bc69',
              '#28a745',
              '#17a2b8',
              '#ffc107',
              '#dc3545'
            ],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          aspectRatio: 1.5,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true,
                font: {
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)',
              titleColor: '#ffffff',
              bodyColor: '#ffffff',
              borderColor: '#10bc69',
              borderWidth: 1,
              cornerRadius: 8
            }
          }
        }
      });
    }

    // Aylık ortalama grafiği
    function createMonthlyChart() {
      const ctx = document.getElementById('monthlyChart').getContext('2d');
      
      // Mevcut grafiği temizle
      if (window.monthlyChart) {
        window.monthlyChart.destroy();
      }
      
      // Aylık gruplandırma
      const monthlyData = {};
      calculations.forEach(calc => {
        const month = new Date(calc.calculation_date).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short' });
        if (!monthlyData[month]) {
          monthlyData[month] = { total: 0, count: 0 };
        }
        monthlyData[month].total += calc.total_carbon_footprint;
        monthlyData[month].count++;
      });
      
      const labels = Object.keys(monthlyData);
      const data = labels.map(month => Math.round(monthlyData[month].total / monthlyData[month].count));
      
      window.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Aylık Ortalama CO₂e (kg)',
            data: data,
            backgroundColor: '#10bc69',
            borderColor: '#10bc69',
            borderWidth: 1,
            borderRadius: 4
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
          }
        }
      });
    }

    // Detay görüntüleme
    function viewDetails(id) {
      const calc = calculations.find(c => c.id === id);
      if (calc) {
        alert(`Hesaplama Detayları:\n\nTarih: ${new Date(calc.calculation_date).toLocaleDateString('tr-TR')}\nToplam CO₂e: ${Math.round(calc.total_carbon_footprint)} kg\nElektrik: ${Math.round(calc.electricity_usage)} kg\nDoğal Gaz: ${Math.round(calc.natural_gas_usage)} kg\nSu: ${Math.round(calc.water_usage)} kg\nAtık: ${Math.round(calc.waste_production)} kg\nUlaşım: ${Math.round(calc.transportation)} kg\nNotlar: ${calc.notes || 'Yok'}`);
      }
    }

    // Çıkış yap
    function logout() {
      localStorage.removeItem('user');
      window.location.href = 'login.html';
    }

    // Sayfa yüklendiğinde
    document.addEventListener('DOMContentLoaded', function() {
      checkAuth();
      loadHistory();
    });
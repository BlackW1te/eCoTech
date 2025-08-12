// Kullanıcı kontrolü
    function checkAuth() {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || user.user_type !== 'admin') {
        window.location.href = 'login.html';
        return;
      }
      
      document.getElementById('userName').textContent = user.first_name + ' ' + user.last_name;
    }

    // Admin verilerini yükle
    async function loadAdminData() {
      await Promise.all([
        loadUsers(),
        loadCalculations(),
        loadFactors(),
        loadStatistics()
      ]);
    }

    // Kullanıcıları yükle
    async function loadUsers() {
      try {
        const response = await fetch('api/admin.php?action=users');
        const data = await response.json();
        
        if (data.success) {
          updateUsersTable(data.data);
        }
      } catch (error) {
        console.error('Kullanıcı yükleme hatası:', error);
      }
    }

    // Kullanıcı tablosunu güncelle
    function updateUsersTable(users) {
      const tbody = document.getElementById('usersTable');
      tbody.innerHTML = '';
      
      users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${user.id}</td>
          <td>${user.username}</td>
          <td>${user.first_name} ${user.last_name}</td>
          <td>${user.email}</td>
          <td>${user.company_name || '-'}</td>
          <td><span class="badge ${user.user_type === 'admin' ? 'bg-danger' : 'bg-success'}">${user.user_type}</span></td>
          <td>${user.calculation_count}</td>
          <td>${new Date(user.created_at).toLocaleDateString('tr-TR')}</td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" onclick="editUser(${user.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteUser(${user.id})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    // Hesaplamaları yükle
    async function loadCalculations() {
      try {
        const response = await fetch('api/admin.php?action=calculations');
        const data = await response.json();
        
        if (data.success) {
          updateCalculationsTable(data.data);
        }
      } catch (error) {
        console.error('Hesaplama yükleme hatası:', error);
      }
    }

    // Hesaplama tablosunu güncelle
    function updateCalculationsTable(calculations) {
      const tbody = document.getElementById('calculationsTable');
      tbody.innerHTML = '';
      
      calculations.slice(0, 20).forEach(calc => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${calc.id}</td>
          <td>${calc.first_name} ${calc.last_name}</td>
          <td>${new Date(calc.calculation_date).toLocaleDateString('tr-TR')}</td>
          <td><span class="badge bg-primary">${Math.round(calc.total_carbon_footprint)} kg</span></td>
          <td>${Math.round(calc.electricity_usage)} kg</td>
          <td>${Math.round(calc.natural_gas_usage)} kg</td>
          <td>${Math.round(calc.water_usage)} kg</td>
          <td>${Math.round(calc.waste_production)} kg</td>
          <td>${Math.round(calc.transportation)} kg</td>
          <td>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteCalculation(${calc.id})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    // Faktörleri yükle
    async function loadFactors() {
      try {
        const response = await fetch('api/admin.php?action=factors');
        const data = await response.json();
        
        if (data.success) {
          updateFactorsTable(data.data);
        }
      } catch (error) {
        console.error('Faktör yükleme hatası:', error);
      }
    }

    // Faktör tablosunu güncelle
    function updateFactorsTable(factors) {
      const tbody = document.getElementById('factorsTable');
      tbody.innerHTML = '';
      
      factors.forEach(factor => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${factor.id}</td>
          <td>${factor.factor_name}</td>
          <td>${factor.factor_value}</td>
          <td>${factor.unit}</td>
          <td>${factor.category}</td>
          <td>${factor.description || '-'}</td>
          <td><span class="badge ${factor.is_active ? 'bg-success' : 'bg-secondary'}">${factor.is_active ? 'Aktif' : 'Pasif'}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-primary me-1" onclick="editFactor(${factor.id})">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger" onclick="deleteFactor(${factor.id})">
              <i class="bi bi-trash"></i>
            </button>
          </td>
        `;
        tbody.appendChild(row);
      });
    }

    // İstatistikleri yükle
    async function loadStatistics() {
      try {
        const response = await fetch('api/admin.php?action=statistics');
        const data = await response.json();
        
        if (data.success) {
          updateStatistics(data.data);
          createCharts(data.data);
        }
      } catch (error) {
        console.error('İstatistik yükleme hatası:', error);
      }
    }

    // İstatistikleri güncelle
    function updateStatistics(data) {
      document.getElementById('totalUsers').textContent = data.user_statistics.total_users;
      document.getElementById('totalCalculations').textContent = data.calculation_statistics.total_calculations;
      document.getElementById('avgFootprint').textContent = Math.round(data.calculation_statistics.average_footprint || 0);
      document.getElementById('totalFactors').textContent = data.user_statistics.total_users; // Geçici olarak
      
      // Genel istatistikler
      const generalStats = document.getElementById('generalStats');
      generalStats.innerHTML = `
        <h6>Genel İstatistikler</h6>
        <p><strong>Toplam Kullanıcı:</strong> ${data.user_statistics.total_users}</p>
        <p><strong>Admin Sayısı:</strong> ${data.user_statistics.admin_count}</p>
        <p><strong>Normal Kullanıcı:</strong> ${data.user_statistics.user_count}</p>
        <p><strong>Toplam Hesaplama:</strong> ${data.calculation_statistics.total_calculations}</p>
        <p><strong>Ortalama CO₂e:</strong> ${Math.round(data.calculation_statistics.average_footprint || 0)} kg</p>
      `;
    }

    // Grafikleri oluştur
    function createCharts(data) {
      createMonthlyChart(data.monthly_statistics);
      createTopUsersChart(data.top_users);
    }

    // Aylık trend grafiği
    function createMonthlyChart(monthlyData) {
      const ctx = document.getElementById('monthlyChart').getContext('2d');
      
      // Mevcut grafiği temizle
      if (window.adminMonthlyChart) {
        window.adminMonthlyChart.destroy();
      }
      
      const labels = monthlyData.map(item => item.month);
      const data = monthlyData.map(item => item.calculation_count);
      
      window.adminMonthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Hesaplama Sayısı',
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

    // En aktif kullanıcılar grafiği
    function createTopUsersChart(topUsers) {
      const ctx = document.getElementById('topUsersChart').getContext('2d');
      
      // Mevcut grafiği temizle
      if (window.topUsersChart) {
        window.topUsersChart.destroy();
      }
      
      const labels = topUsers.map(user => user.first_name + ' ' + user.last_name);
      const data = topUsers.map(user => user.calculation_count);
      
      window.topUsersChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: labels,
          datasets: [{
            data: data,
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

    // Modal işlemleri
    function showAddUserModal() {
      document.getElementById('addUserForm').reset();
      new bootstrap.Modal(document.getElementById('addUserModal')).show();
    }

    function showAddFactorModal() {
      document.getElementById('addFactorForm').reset();
      new bootstrap.Modal(document.getElementById('addFactorModal')).show();
    }

    // Kullanıcı ekle
    async function addUser() {
      const formData = {
        username: document.getElementById('newUsername').value,
        first_name: document.getElementById('newFirstName').value,
        last_name: document.getElementById('newLastName').value,
        email: document.getElementById('newEmail').value,
        company_name: document.getElementById('newCompany').value,
        user_type: document.getElementById('newUserType').value
      };
      
      try {
        const response = await fetch('api/admin.php?action=users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          bootstrap.Modal.getInstance(document.getElementById('addUserModal')).hide();
          loadUsers();
          alert('Kullanıcı başarıyla eklendi!');
        } else {
          alert('Hata: ' + result.error);
        }
      } catch (error) {
        console.error('Kullanıcı ekleme hatası:', error);
        alert('Kullanıcı eklenirken bir hata oluştu.');
      }
    }

    // Faktör ekle
    async function addFactor() {
      const formData = {
        factor_name: document.getElementById('newFactorName').value,
        factor_value: parseFloat(document.getElementById('newFactorValue').value),
        unit: document.getElementById('newFactorUnit').value,
        category: document.getElementById('newFactorCategory').value,
        description: document.getElementById('newFactorDescription').value
      };
      
      try {
        const response = await fetch('api/admin.php?action=factors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          bootstrap.Modal.getInstance(document.getElementById('addFactorModal')).hide();
          loadFactors();
          alert('Faktör başarıyla eklendi!');
        } else {
          alert('Hata: ' + result.error);
        }
      } catch (error) {
        console.error('Faktör ekleme hatası:', error);
        alert('Faktör eklenirken bir hata oluştu.');
      }
    }

    // Silme işlemleri
    async function deleteUser(id) {
      if (confirm('Bu kullanıcıyı silmek istediğinizden emin misiniz?')) {
        try {
          const response = await fetch(`api/admin.php?action=users&id=${id}`, {
            method: 'DELETE'
          });
          
          const result = await response.json();
          
          if (result.success) {
            loadUsers();
            alert('Kullanıcı başarıyla silindi!');
          } else {
            alert('Hata: ' + result.error);
          }
        } catch (error) {
          console.error('Kullanıcı silme hatası:', error);
          alert('Kullanıcı silinirken bir hata oluştu.');
        }
      }
    }

    async function deleteCalculation(id) {
      if (confirm('Bu hesaplamayı silmek istediğinizden emin misiniz?')) {
        try {
          const response = await fetch(`api/admin.php?action=calculations&id=${id}`, {
            method: 'DELETE'
          });
          
          const result = await response.json();
          
          if (result.success) {
            loadCalculations();
            alert('Hesaplama başarıyla silindi!');
          } else {
            alert('Hata: ' + result.error);
          }
        } catch (error) {
          console.error('Hesaplama silme hatası:', error);
          alert('Hesaplama silinirken bir hata oluştu.');
        }
      }
    }

    async function deleteFactor(id) {
      if (confirm('Bu faktörü silmek istediğinizden emin misiniz?')) {
        try {
          const response = await fetch(`api/admin.php?action=factors&id=${id}`, {
            method: 'DELETE'
          });
          
          const result = await response.json();
          
          if (result.success) {
            loadFactors();
            alert('Faktör başarıyla silindi!');
          } else {
            alert('Hata: ' + result.error);
          }
        } catch (error) {
          console.error('Faktör silme hatası:', error);
          alert('Faktör silinirken bir hata oluştu.');
        }
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
      loadAdminData();
    });
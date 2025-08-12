// Form gönderimi
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const formData = new FormData(this);
      const data = Object.fromEntries(formData);
      
      // Şifre kontrolü
      if (data.password !== data.password_confirm) {
        alert('Şifreler eşleşmiyor!');
        return;
      }
      
      if (data.password.length < 6) {
        alert('Şifre en az 6 karakter olmalıdır!');
        return;
      }
      
      try {
        console.log('Gönderilen veri:', data);
        
        const response = await fetch('api/auth.php?action=register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data)
        });
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Response data:', result);
        
        if (result.success) {
          alert('Kayıt başarılı! Giriş yapabilirsiniz.');
          window.location.href = 'login.html';
        } else {
          alert('Kayıt hatası: ' + result.error);
        }
      } catch (error) {
        console.error('Kayıt hatası:', error);
        alert('Kayıt sırasında bir hata oluştu: ' + error.message);
      }
    });
    
    // Telefon numarası kontrolü
    document.getElementById('phone').addEventListener('input', function() {
      const phone = this.value;
      const warning = document.getElementById('phoneWarning');
      
      if (phone.length > 0 && !phone.match(/^[0-9]{10}$/)) {
        warning.textContent = 'Telefon numarası 10 haneli olmalıdır (5xxxxxxxxx)';
        warning.style.color = 'red';
      } else {
        warning.textContent = '';
      }
    });
    
    // Şifre kontrolü
    document.getElementById('passwordInput').addEventListener('input', function() {
      const password = this.value;
      const warning = document.getElementById('passwordWarning');
      
      if (password.length > 0 && password.length < 6) {
        warning.textContent = 'Şifre en az 6 karakter olmalıdır';
        warning.style.color = 'red';
      } else {
        warning.textContent = '';
      }
    });
    
    // Şifre tekrar kontrolü
    document.getElementById('passwordConfirmInput').addEventListener('input', function() {
      const password = document.getElementById('passwordInput').value;
      const confirmPassword = this.value;
      const warning = document.getElementById('passwordConfirmWarning');
      
      if (confirmPassword.length > 0 && password !== confirmPassword) {
        warning.textContent = 'Şifreler eşleşmiyor';
        warning.style.color = 'red';
      } else {
        warning.textContent = '';
      }
    });
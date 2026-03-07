// Development helper functions for Gateway token
if (window.location.hostname === 'localhost') {
  // Helper function to set gateway token
  window.setGatewayToken = function(token) {
    sessionStorage.setItem('subchat_gateway_token', token);
    console.log('✅ Gateway token saved to session storage');
    console.log('🔄 Please refresh the page to reconnect');
    return 'Token saved! Refresh the page.';
  };

  // Quick fix function
  window.fixGatewayAuth = function() {
    const correctToken = '3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f';
    sessionStorage.setItem('subchat_gateway_token', correctToken);
    console.log('✅ Using correct Gateway token');
    window.location.reload();
  };

  // Show current token
  window.showCurrentToken = function() {
    const current = sessionStorage.getItem('subchat_gateway_token') || 'None set';
    console.log('🔑 Current Gateway token:', current);
    return current;
  };

  // Instructions
  console.log('%c🔧 SubChat Development Helpers', 'color: blue; font-weight: bold; font-size: 14px');
  console.log('💡 Gateway token mismatch? Try these:');
  console.log('   fixGatewayAuth() - Use correct token and reload');
  console.log('   setGatewayToken("your-token") - Set custom token');
  console.log('   showCurrentToken() - Show current token');
  console.log('🎯 Current default token: 3a46fc7cb69ecda092d43712ed997b7c8ffd5b4449a97c2f');
}

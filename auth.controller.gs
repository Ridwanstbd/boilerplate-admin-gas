function apiRegisterAdmin(email, password) {
  try {
    const authService = new AuthService();
    return authService.register(email, password);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function apiLoginUser(email, password) {
  try {
    const authService = new AuthService();
    return authService.login(email, password);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

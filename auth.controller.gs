const authService = new AuthService();

function apiRegisterAdmin(email, password) {
  try {
    return authService.register(email, password);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function apiLoginUser(email, password) {
  try {
    return authService.login(email, password);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

class CryptoUtils {
  static hashSHA256(input) {
    const rawHash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      input,
      Utilities.Charset.UTF_8,
    );
    let output = "";
    for (let i = 0; i < rawHash.length; i++) {
      let v = rawHash[i];
      if (v < 0) v += 256;
      if (v.toString(16).length == 1) output += "0";
      output += v.toString(16);
    }
    return output;
  }

  static isPasswordStrong(password) {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return regex.test(password);
  }
}

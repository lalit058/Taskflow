import React, { useEffect } from "react";

const LoginForm = ({
  isLogin,
  setIsLogin,
  formData,
  setFormData,
  handleSubmit,
  error,
  loading,
  setError,
  setLoading,
}) => {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [error, setError]);

  // convert uploaded image file to Base64 string with size/canvas handling
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Guard against raw files larger than 5MB (prevents Base64 payload bloat)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Compress image using Canvas to ensure clean saved strings
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const scaleFactor = MAX_WIDTH / img.width;

        if (scaleFactor < 1) {
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleFactor;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compressed Base64 data URL
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
        setFormData({ ...formData, avatar: compressedBase64 });
      };
    };
    reader.readAsDataURL(file);
  };

  // Enter key to submit the form
  const onSubmit = (e) => {
    e.preventDefault();
    handleSubmit();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-4">
          <h2 className="text-3xl font-black text-gray-800">
            {isLogin ? "Welcome Back" : "Join TaskFlow"}
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            {isLogin
              ? "Login to manage your daily task."
              : "Start organizing your tasks today"}
          </p>
        </div>

        <div className="h-6 flex items-center justify-center mb-4">
          {error && (
            <div className="text-red-700 text-sm bg-transparent text-center font-medium">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {!isLogin && (
            <>
              {/* Profile Avatar Upload */}
              <div className="flex items-center space-x-4 p-2 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 flex items-center justify-center border border-gray-300">
                  {formData.avatar ? (
                    <img
                      src={formData.avatar}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-xs text-center font-bold">
                      Photo
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
                    Profile Photo (Optional)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={formData.name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                  Account Role
                </label>
                <select
                  className="w-full px-4 text-sm py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                  value={formData.role || "user"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="name@company.com"
              className="w-full px-4 text-sm py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              value={formData.password || ""}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-4 text-sm py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.confirmPassword || ""}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                required
              />
            </div>
          )}

          <div className="flex justify-center w-full mt-4">
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition duration-300 disabled:bg-blue-300 disabled:shadow-none active:scale-[0.98] text-sm min-w-[160px]"
            >
              {loading
                ? "Authenticating..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </div>
        </form>

        <div className="mt-3 border-t border-gray-100 text-center">
          <p className="text-gray-600 text-sm">
            {isLogin ? "New to TaskFlow? " : "Already a member? "}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
            >
              {isLogin ? "Create an account" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;

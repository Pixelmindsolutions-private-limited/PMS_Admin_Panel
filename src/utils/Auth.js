// // src/utils/auth.js
// export const getAuthToken = () => {
//   try {
//     const adminDetails = sessionStorage.getItem("adminDetails");
//     if (!adminDetails) return null;
//     const parsed = JSON.parse(adminDetails);
//     return parsed.token || null;
//   } catch {
//     return null;
//   }
// };

// export const getAuthHeaders = () => {
//   const token = getAuthToken();
//   return {
//     "Content-Type": "application/json",
//     ...(token && { Authorization: `Bearer ${token}` }),
//   };
// };



// utils/Auth.js


export const API_BASE = "https://pmsbackend.pixelmindsolutions.com/api" ;

export const API_BASE_URL = "https://pmsbackend.pixelmindsolutions.com/api" ;

const getAuthToken = () => {
  for (const key of ["loginDetails", "adminDetails"]) {
    try {
      const details = JSON.parse(sessionStorage.getItem(key) || "null");
      if (details?.token) return details.token;
    } catch (error) {
      console.error(`Error reading ${key} from sessionStorage:`, error);
    }
  }

  return null;
};

export const getAuthHeaders = () => {
  const token = getAuthToken();

  if (!token) {
    console.warn("No auth token found in sessionStorage");
    return {};
  }

  return {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
};

// Optional: Function to check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken();
};

// Optional: Function to get token
export const getToken = () => {
  return getAuthToken();
};

import axios from 'axios';
REACT_APP_API_URL="http://192.168.219.184:8085";
const USER_API_BASE_URL = process.env.REACT_APP_API_URL + "/users";

export const getUsers = async () => {
  try {
    const response = await axios.get(USER_API_BASE_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

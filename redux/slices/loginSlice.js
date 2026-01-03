import { createSlice } from '@reduxjs/toolkit';

const initialState = {
   phoneNumber: '',
   isStage2: false, // true means OTP sent, waiting for code
   verificationCode: '',
   isLoading: false,
   error: null,
};

const loginSlice = createSlice({
   name: 'login', // Corrected name from 'blogSlice' to 'login'
   initialState,
   reducers: {
      changeIsStage2: (state, action) => {
         state.isStage2 = action.payload;
         state.error = null; // Reset error when stage changes
      },
      changePhoneNumber: (state, action) => {
         state.phoneNumber = action.payload;
      },
      changeVerificationCode: (state, action) => {
         state.verificationCode = action.payload;
      },
      setLoading: (state, action) => {
         state.isLoading = action.payload;
      },
      setError: (state, action) => {
         state.error = action.payload;
      },
      resetLoginState: (state) => {
         state.phoneNumber = '';
         state.isStage2 = false;
         state.verificationCode = '';
         state.isLoading = false;
         state.error = null;
      },
   },
});

export const { changeIsStage2, changePhoneNumber, changeVerificationCode, setLoading, setError, resetLoginState } = loginSlice.actions;

export default loginSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
   pCarDates: [],
   carDates: [],
   deliveryTime: '10:00',
   returnTime: '10:00',
   isSingleGalleryOpen: false,
   isHeaderClose: false,
   isSearchOpen: false,
   isFilterOpen: false,
   isDateSelectOpen: false,
   isTranslatePopupOpen: false,
   isSearchPopupOpen: false,
   roadMapStep: 1,
   cities: {
      dubai: 1,
      istanbul: 2,
      kayseri: 12,
      kish: 7,
      izmir: 8,
      georgia: 13,
      oman: 6,
      samsun: 11,
      antalya: 10,
      ankara: 9,
   },
   branches: null,
   homeComments: null,
   homeBlogs: null,
   selectedCity: null,
   isDateJalili: true,
   descriptionPopup: { title: null, description: null },
   locations: [],
   deliveryLocation: { isDesired: false, location: null, address: '' },
   returnLocation: { isDesired: false, location: null, address: '' },
   areLocationsSame: true,
   isLocationPopupOpen: false,
   isInfoListOpen: false,

   toast: {
      show: false,
      message: '',
      type: 'info',
   },
};

const globalSlice = createSlice({
   name: 'globalSlice',
   initialState,
   reducers: {
      changePCarDates: (state, action) => {
         state.pCarDates = action.payload;
      },
      changeCarDates: (state, action) => {
         state.carDates = action.payload;
      },
      changeSingleGalleryStatus: (state, action) => {
         state.isSingleGalleryOpen = action.payload;
      },
      changeSearchStatus: (state, action) => {
         state.isSearchOpen = action.payload;
      },
      changeFilterStatus: (state, action) => {
         state.isFilterOpen = action.payload;
      },
      changeIsHeaderClose: (state, action) => {
         state.isHeaderClose = action.payload;
      },
      changeRoadMapStep: (state, action) => {
         state.roadMapStep = action.payload;
      },
      changeIsDateSelectOpen: (state, action) => {
         state.isDateSelectOpen = action.payload;
      },
      changeDeliveryTime: (state, action) => {
         state.deliveryTime = action.payload;
      },
      changeReturnTime: (state, action) => {
         state.returnTime = action.payload;
      },
      changeIsTranslatePopupOpen: (state, action) => {
         state.isTranslatePopupOpen = action.payload;
      },
      changeIsSearchPopupOpen: (state, action) => {
         state.isSearchPopupOpen = action.payload;
      },
      changeSelectedCity: (state, action) => {
         state.selectedCity = action.payload;
      },
      changeIsDateJalili: (state, action) => {
         state.isDateJalili = action.payload;
      },
      changeDescriptionPopup: (state, action) => {
         state.descriptionPopup = action.payload;
      },
      changeDeliveryLocation: (state, action) => {
         state.deliveryLocation = action.payload;
      },
      changeReturnLocation: (state, action) => {
         state.returnLocation = action.payload;
      },
      changeAreLocationsSame: (state, action) => {
         state.areLocationsSame = action.payload;
      },
      changeIsLocationPopupOpen: (state, action) => {
         state.isLocationPopupOpen = action.payload;
      },
      changeIsInfoListOpen: (state, action) => {
         state.isInfoListOpen = action.payload;
      },
      changeBranches: (state, action) => {
         state.branches = action.payload;
      },
      changeHomeComments: (state, action) => {
         state.homeComments = action.payload;
      },
      changeHomeBlogs: (state, action) => {
         state.homeBlogs = action.payload;
      },

      // Toast Actions
      showToast: (state, action) => {
         state.toast = {
            show: true,
            message: action.payload.message,
            type: action.payload.type || 'info',
         };
      },
      hideToast: (state) => {
         state.toast = { ...state.toast, show: false };
      },
   },
});

export const { changePCarDates, changeCarDates, changeSingleGalleryStatus, changeSearchStatus, changeFilterStatus, changeIsHeaderClose, changeRoadMapStep, changeIsDateSelectOpen, changeDeliveryTime, changeReturnTime, changeIsTranslatePopupOpen, changeIsSearchPopupOpen, changeSelectedCity, changeIsDateJalili, changeDescriptionPopup, changeDeliveryLocation, changeReturnLocation, changeAreLocationsSame, changeIsLocationPopupOpen, changeIsInfoListOpen, changeBranches, changeHomeBlogs, changeHomeComments, showToast, hideToast } = globalSlice.actions;

export default globalSlice.reducer;

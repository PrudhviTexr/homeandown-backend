import { State, District, Mandal } from '@/types/location';

// Sample location data for Andhra Pradesh and Telangana
export const LOCATION_DATA: State[] = [
  {
    id: 'ap',
    name: 'Andhra Pradesh',
    code: 'AP',
    districts: [
      {
        id: 'visakhapatnam',
        name: 'Visakhapatnam',
        state_id: 'ap',
        mandals: [
          { id: 'visakhapatnam_rural', name: 'Visakhapatnam Rural', district_id: 'visakhapatnam' },
          { id: 'anakapalli', name: 'Anakapalli', district_id: 'visakhapatnam' },
          { id: 'pendurthi', name: 'Pendurthi', district_id: 'visakhapatnam' },
          { id: 'bheemunipatnam', name: 'Bheemunipatnam', district_id: 'visakhapatnam' },
          { id: 'gajuwaka', name: 'Gajuwaka', district_id: 'visakhapatnam' }
        ]
      },
      {
        id: 'guntur',
        name: 'Guntur',
        state_id: 'ap',
        mandals: [
          { id: 'guntur_urban', name: 'Guntur Urban', district_id: 'guntur' },
          { id: 'tenali', name: 'Tenali', district_id: 'guntur' },
          { id: 'mangalagiri', name: 'Mangalagiri', district_id: 'guntur' },
          { id: 'bapatla', name: 'Bapatla', district_id: 'guntur' }
        ]
      },
      {
        id: 'krishna',
        name: 'Krishna',
        state_id: 'ap',
        mandals: [
          { id: 'vijayawada', name: 'Vijayawada', district_id: 'krishna' },
          { id: 'machilipatnam', name: 'Machilipatnam', district_id: 'krishna' },
          { id: 'gudivada', name: 'Gudivada', district_id: 'krishna' }
        ]
      }
    ]
  },
  {
    id: 'ts',
    name: 'Telangana',
    code: 'TS',
    districts: [
      {
        id: 'hyderabad',
        name: 'Hyderabad',
        state_id: 'ts',
        mandals: [
          { id: 'secunderabad', name: 'Secunderabad', district_id: 'hyderabad' },
          { id: 'kukatpally', name: 'Kukatpally', district_id: 'hyderabad' },
          { id: 'lb_nagar', name: 'LB Nagar', district_id: 'hyderabad' },
          { id: 'charminar', name: 'Charminar', district_id: 'hyderabad' },
          { id: 'serilingampally', name: 'Serilingampally', district_id: 'hyderabad' }
        ]
      },
      {
        id: 'warangal',
        name: 'Warangal',
        state_id: 'ts',
        mandals: [
          { id: 'warangal_urban', name: 'Warangal Urban', district_id: 'warangal' },
          { id: 'hanamkonda', name: 'Hanamkonda', district_id: 'warangal' },
          { id: 'kazipet', name: 'Kazipet', district_id: 'warangal' }
        ]
      }
    ]
  },
  {
    id: 'ka',
    name: 'Karnataka',
    code: 'KA',
    districts: [
      {
        id: 'bangalore_urban',
        name: 'Bangalore Urban',
        state_id: 'ka',
        mandals: [
          { id: 'bangalore_north', name: 'Bangalore North', district_id: 'bangalore_urban' },
          { id: 'bangalore_south', name: 'Bangalore South', district_id: 'bangalore_urban' },
          { id: 'bangalore_east', name: 'Bangalore East', district_id: 'bangalore_urban' },
          { id: 'yelahanka', name: 'Yelahanka', district_id: 'bangalore_urban' }
        ]
      }
    ]
  }
];

export const getStateById = (stateId: string): State | undefined => {
  return LOCATION_DATA.find(state => state.id === stateId);
};

export const getDistrictById = (stateId: string, districtId: string): District | undefined => {
  const state = getStateById(stateId);
  return state?.districts.find(district => district.id === districtId);
};

export const getMandalById = (stateId: string, districtId: string, mandalId: string): Mandal | undefined => {
  const district = getDistrictById(stateId, districtId);
  return district?.mandals.find(mandal => mandal.id === mandalId);
};

export const getDistrictsByState = (stateId: string): District[] => {
  const state = getStateById(stateId);
  return state?.districts || [];
};

export const getMandalsByDistrict = (stateId: string, districtId: string): Mandal[] => {
  const district = getDistrictById(stateId, districtId);
  return district?.mandals || [];
};

export const getAllStates = (): State[] => {
  return LOCATION_DATA;
};
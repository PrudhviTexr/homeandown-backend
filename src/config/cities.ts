// Centralized city configuration for the application
export interface CityConfig {
  name: string;
  state: string;
  image: string;
  coordinates: [number, number]; // [latitude, longitude]
}

export const SUPPORTED_CITIES: CityConfig[] = [
  {
    name: 'Visakhapatnam',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg',
    coordinates: [17.6868, 83.2185]
  },
  {
    name: 'Vijayawada',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg',
    coordinates: [16.5062, 80.6480]
  },
  {
    name: 'Guntur',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
    coordinates: [16.3067, 80.4365]
  },
  {
    name: 'Nellore',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
    coordinates: [14.4426, 79.9865]
  },
  {
    name: 'Kurnool',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
    coordinates: [15.8281, 78.0373]
  },
  {
    name: 'Rajahmundry',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/2467558/pexels-photo-2467558.jpeg',
    coordinates: [17.0005, 81.8040]
  },
  {
    name: 'Tirupati',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg',
    coordinates: [13.6288, 79.4192]
  },
  {
    name: 'Kakinada',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg',
    coordinates: [16.9891, 82.2475]
  },
  {
    name: 'Anantapur',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg',
    coordinates: [14.6819, 77.6006]
  },
  {
    name: 'Chittoor',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg',
    coordinates: [13.2172, 79.1003]
  },
  {
    name: 'Eluru',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg',
    coordinates: [16.7107, 81.0953]
  },
  {
    name: 'Ongole',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg',
    coordinates: [15.5057, 80.0499]
  },
  {
    name: 'Machilipatnam',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/2467558/pexels-photo-2467558.jpeg',
    coordinates: [16.1875, 81.1389]
  },
  {
    name: 'Kadapa',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg',
    coordinates: [14.4673, 78.8242]
  },
  {
    name: 'Vizianagaram',
    state: 'Andhra Pradesh',
    image: 'https://images.pexels.com/photos/3052361/pexels-photo-3052361.jpeg',
    coordinates: [18.1167, 83.4000]
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/11251341/pexels-photo-11251341.jpeg',
    coordinates: [17.4065, 78.4772]
  },
  {
    name: 'Warangal',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/739987/pexels-photo-739987.jpeg',
    coordinates: [17.9689, 79.5941]
  },
  {
    name: 'Nizamabad',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/6586178/pexels-photo-6586178.jpeg',
    coordinates: [18.6725, 78.0941]
  },
  {
    name: 'Khammam',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/1029339/pexels-photo-1029339.jpeg',
    coordinates: [17.2473, 80.1514]
  },
  {
    name: 'Karimnagar',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg',
    coordinates: [18.4386, 79.1288]
  },
  {
    name: 'Mahbubnagar',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/1002406/pexels-photo-1002406.jpeg',
    coordinates: [16.7393, 77.9993]
  },
  {
    name: 'Nalgonda',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg',
    coordinates: [17.0542, 79.2673]
  },
  {
    name: 'Adilabad',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/11251341/pexels-photo-11251341.jpeg',
    coordinates: [19.6669, 78.5316]
  },
  {
    name: 'Suryapet',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/739987/pexels-photo-739987.jpeg',
    coordinates: [17.1404, 79.6190]
  },
  {
    name: 'Miryalaguda',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/6586178/pexels-photo-6586178.jpeg',
    coordinates: [16.8747, 79.5663]
  },
  {
    name: 'Jagtial',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/1029339/pexels-photo-1029339.jpeg',
    coordinates: [18.7894, 78.9113]
  },
  {
    name: 'Mancherial',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg',
    coordinates: [18.8730, 79.4534]
  },
  {
    name: 'Siddipet',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/1002406/pexels-photo-1002406.jpeg',
    coordinates: [18.1018, 78.8522]
  },
  {
    name: 'Wanaparthy',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg',
    coordinates: [16.3670, 78.0610]
  },
  {
    name: 'Medak',
    state: 'Telangana',
    image: 'https://images.pexels.com/photos/11251341/pexels-photo-11251341.jpeg',
    coordinates: [18.0480, 78.2747]
  },
  {
    name: 'Bangalore',
    state: 'Karnataka',
    image: 'https://images.pexels.com/photos/739987/pexels-photo-739987.jpeg',
    coordinates: [12.9352, 77.6245]
  },
  {
    name: 'Chennai',
    state: 'Tamil Nadu',
    image: 'https://images.pexels.com/photos/6586178/pexels-photo-6586178.jpeg',
    coordinates: [13.0827, 80.2707]
  },
  {
    name: 'Mumbai',
    state: 'Maharashtra',
    image: 'https://images.pexels.com/photos/1029339/pexels-photo-1029339.jpeg',
    coordinates: [19.0760, 72.8777]
  },
  {
    name: 'Delhi',
    state: 'Delhi',
    image: 'https://images.pexels.com/photos/789750/pexels-photo-789750.jpeg',
    coordinates: [28.7041, 77.1025]
  },
  {
    name: 'Pune',
    state: 'Maharashtra',
    image: 'https://images.pexels.com/photos/1002406/pexels-photo-1002406.jpeg',
    coordinates: [18.5204, 73.8567]
  },
  {
    name: 'Kolkata',
    state: 'West Bengal',
    image: 'https://images.pexels.com/photos/962464/pexels-photo-962464.jpeg',
    coordinates: [22.5726, 88.3639]
  }
];

export const getCityByName = (cityName: string): CityConfig | undefined => {
  return SUPPORTED_CITIES.find(city => 
    city.name.toLowerCase() === cityName.toLowerCase()
  );
};

export const getCityOptions = (): { label: string; value: string }[] => {
  return (SUPPORTED_CITIES || []).map(city => ({
    label: city.name,
    value: city.name
  }));
};

export const getDefaultCityCoordinates = (): [number, number] => {
  return (SUPPORTED_CITIES && SUPPORTED_CITIES[0]) ? SUPPORTED_CITIES[0].coordinates : [17.6868, 83.2185]; // Default to Visakhapatnam
};
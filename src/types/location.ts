export interface State {
  id: string;
  name: string;
  code: string;
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  state_id: string;
  mandals: Mandal[];
}

export interface Mandal {
  id: string;
  name: string;
  district_id: string;
}

export interface LocationHierarchy {
  state: string;
  district: string;
  mandal: string;
}
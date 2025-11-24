export interface Firm {
  id: string;
  name: string;
  rate?: number;
  type?: string;
  address: string;
  phone: string;
  town?: string;
  doLaw?: boolean;
  isWater?: boolean;
  isSoil?: boolean;
  result?: string;
  [key: string]: any;
}

export interface FirmList {
  title: string;
  firms: Firm[];
}

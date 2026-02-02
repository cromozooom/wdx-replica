export interface Basket {
  id: number;
  name: string;
  configurationIds: number[]; // IDs of configurations in this basket
  createdDate: Date;
  createdBy: string;
  lastModifiedDate: Date;
  lastModifiedBy: string;
}

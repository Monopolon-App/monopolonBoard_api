export interface nftMetadataDTO {
  data: nftMetadata[];
}

export interface nftMetadata {
  _id: string;
  attributes: Attributes;
  token: Token;
  royaltyRatio: number;
  videoUrl: string;
  imgUrl: string;
  type: number;
  description: string;
  name: string;
  nftCode: number;
}

export interface Attributes {
  rarity: string;
  commonAttribute: CommonAttribute;
  category: string;
  secondaryStatistics: any;
  uniquePassives: string;
}

export interface CommonAttribute {
  str: number;
  dex: number;
  luk: number;
  prep: number;
  hp: number;
  mp: number;
}

export interface Token {
  address: string;
  ipfsUrl: string;
  uri: string;
  totalCopies: number;
  totalMinted: number;
  onSaleQuantity: number;
  airdropQuantity: number;
}

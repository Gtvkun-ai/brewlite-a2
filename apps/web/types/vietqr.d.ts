declare module 'vietqr' {
  export function genQRText(options: {
    acqId: string;
    accountNo: string;
    amount?: string | number;
    addInfo?: string;
  }): string;
}

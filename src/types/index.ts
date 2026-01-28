export type FreightStatus = 'EM_TRANSITO' | 'DESCARREGADO' | 'PAGO' | 'ATRASADO' | 'AGENDADO';

export interface Freight {
    id: string;
    date: string; // DIA
    product: string; // PRODUTO
    licensePlate: string; // PLACA
    driverName: string; // MOTORISTA
    destination: string; // DESTINO
    weightLoaded: number; // PESO CARREGAMENTO
    sacksAmount: number; // PESO POR SACA (In spreadsheet context this is quantity)
    weightSack: number; // Constant 60kg usually
    unitPrice: number; // The actual price per sack (e.g. 149.00) - Internal use or display?
    // User spreadsheet column "VALOR POR SACA" contains the TOTAL value in the example (177k). 
    // We will map 'totalValue' to that column for display, but keep clear naming in code.
    totalValue: number; // VALOR POR SACA (Spreadsheet Header naming convention)

    dischargeDate?: string; // DATA DESCARGA
    receipts: number; // RECEBIMENTOS
    receiptDate?: string; // DATA RECEBIMENTOS
    toReceive: number; // A RECEBER

    status: FreightStatus;
}

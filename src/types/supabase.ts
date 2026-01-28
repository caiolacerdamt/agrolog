export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.1"
    }
    public: {
        Tables: {
            drivers: {
                Row: {
                    created_at: string | null
                    id: string
                    license_plate: string | null
                    name: string
                    phone: string | null
                    status: string | null
                    user_id: string
                    rating: number | null
                }
                Insert: {
                    created_at?: string | null
                    id?: string
                    license_plate?: string | null
                    name: string
                    phone?: string | null
                    status?: string | null
                    user_id?: string
                }
                Update: {
                    created_at?: string | null
                    id?: string
                    license_plate?: string | null
                    name?: string
                    phone?: string | null
                    status?: string | null
                    user_id?: string
                }
                Relationships: []
            }
            freights: {
                Row: {
                    created_at: string | null
                    date: string
                    destination: string
                    discharge_date: string | null
                    driver_id: string | null
                    id: string
                    invoice_number: string | null
                    origin: string | null
                    product: string
                    receipts: number | null
                    sacks_amount: number | null
                    status: string | null
                    to_receive: number | null
                    total_value: number
                    unit_price: number
                    user_id: string
                    weight_loaded: number
                    weight_sack: number | null
                }
                Insert: {
                    created_at?: string | null
                    date: string
                    destination: string
                    discharge_date?: string | null
                    driver_id?: string | null
                    id?: string
                    invoice_number?: string | null
                    origin?: string | null
                    product: string
                    receipts?: number | null
                    sacks_amount?: number | null
                    status?: string | null
                    to_receive?: number | null
                    total_value: number
                    unit_price: number
                    user_id?: string
                    weight_loaded: number
                    weight_sack?: number | null
                }
                Update: {
                    created_at?: string | null
                    date?: string
                    destination?: string
                    discharge_date?: string | null
                    driver_id?: string | null
                    id?: string
                    invoice_number?: string | null
                    origin?: string | null
                    product?: string
                    receipts?: number | null
                    sacks_amount?: number | null
                    status?: string | null
                    to_receive?: number | null
                    total_value?: number
                    unit_price?: number
                    user_id?: string
                    weight_loaded?: number
                    weight_sack?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "freights_driver_id_fkey"
                        columns: ["driver_id"]
                        isOneToOne: false
                        referencedRelation: "drivers"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Enums: {}
        CompositeTypes: {}
    }
}

export const Constants = {
    public: {
        Enums: {},
    },
} as const

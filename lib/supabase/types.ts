// Hand-written types for the public tables. Re-generate with
// `npx supabase gen types typescript --project-id <ref>` if the schema changes.

export type OrgRole = "donor" | "ngo" | "admin";
export type ListingStatus = "open" | "claimed" | "completed" | "expired" | "cancelled";

// The Supabase client types its Database generic as
//   Row: Record<string, unknown>
//   Insert: Record<string, unknown>
//   Update: Record<string, unknown>
// so each row/insert/update must carry an index signature. We define the
// domain types with the signature baked in so callers (and the Database
// generic) both see the right thing.
type DbRecord = Record<string, unknown>;

export type Org = {
  id: string;
  auth_user_id: string;
  role: OrgRole;
  org_name: string;
  org_type: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  address_line: string | null;
  city: string | null;
  verified: boolean;
  verified_at: string | null;
  created_at: string;
} & DbRecord;

export type Listing = {
  id: string;
  donor_org_id: string;
  food_type: string;
  quantity: string;
  ready_by: string;
  pickup_window_minutes: number;
  pickup_address: string;
  photo_path: string | null;
  status: ListingStatus;
  claimed_by_org: string | null;
  claimed_at: string | null;
  completed_at: string | null;
  created_at: string;
  expires_at: string;
} & DbRecord;

export type Claim = {
  id: string;
  listing_id: string;
  ngo_org_id: string;
  claimed_at: string;
  released_at: string | null;
} & DbRecord;

export type Donation = {
  id: string;
  donor_name: string | null;
  donor_email: string | null;
  amount_inr: number;
  logistics_share: number;
  packaging_share: number;
  created_at: string;
} & DbRecord;

export type FundTotals = {
  logistics_total: number;
  packaging_total: number;
  grand_total: number;
  donation_count: number;
} & DbRecord;

// Insert = the row with the listed keys made optional. Kept as a single
// helper so the call sites stay readable.
type Insert<T, K extends keyof T> = Omit<T, K & string> &
  Partial<Pick<T, K & string>>;
type Update<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      orgs: {
        Row: Org;
        Insert: Insert<Org, "id" | "created_at" | "verified" | "verified_at">;
        Update: Update<Org>;
        Relationships: [];
      };
      listings: {
        Row: Listing;
        Insert: Insert<
          Listing,
          | "id"
          | "status"
          | "claimed_by_org"
          | "claimed_at"
          | "completed_at"
          | "created_at"
          | "expires_at"
          | "photo_path"
        >;
        Update: Update<Listing>;
        Relationships: [];
      };
      claims: {
        Row: Claim;
        Insert: Insert<Claim, "id" | "claimed_at" | "released_at">;
        Update: Update<Claim>;
        Relationships: [];
      };
      donations: {
        Row: Donation;
        Insert: Insert<Donation, "id" | "created_at" | "donor_name" | "donor_email">;
        Update: Update<Donation>;
        Relationships: [];
      };
    };
    Views: {
      fund_totals: { Row: FundTotals; Relationships: [] };
    };
    Functions: {
      claim_listing: {
        Args: { p_listing_id: string };
        Returns: Listing;
      };
      release_claim: {
        Args: { p_listing_id: string };
        Returns: Listing;
      };
      complete_listing: {
        Args: { p_listing_id: string };
        Returns: Listing;
      };
      cancel_listing: {
        Args: { p_listing_id: string };
        Returns: Listing;
      };
      expire_stale_listings: {
        Args: Record<string, never>;
        Returns: number;
      };
      approve_org: {
        Args: { p_org_id: string };
        Returns: Org;
      };
    };
  };
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductCategory = "vue" | "soleil" | "ski" | "sport" | "enfant";
export type ProductGender = "homme" | "femme" | "mixte" | "enfant";
export type LensType = "unifocaux" | "progressifs" | "mi-distance" | "sans-correction";
export type OrderStatus =
  | "en_attente_paiement"
  | "payee"
  | "ordonnance_en_validation"
  | "ordonnance_validee"
  | "ordonnance_refusee"
  | "en_fabrication"
  | "expediee"
  | "prete_en_boutique"
  | "livree"
  | "annulee";
export type DeliveryMethod = "domicile" | "boutique";
export type PaymentMethod = "stripe" | "alma";
export type AppointmentStatus = "confirmee" | "annulee" | "terminee";
export type AppointmentType = "examen_vue" | "essayage" | "ajustement" | "conseil";
export type UserRole = "client" | "admin";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          role?: UserRole;
          updated_at?: string;
        };
      };
      addresses: {
        Row: {
          id: string;
          profile_id: string;
          label: string | null;
          first_name: string;
          last_name: string;
          street: string;
          street_2: string | null;
          city: string;
          postal_code: string;
          country: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          label?: string | null;
          first_name: string;
          last_name: string;
          street: string;
          street_2?: string | null;
          city: string;
          postal_code: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          label?: string | null;
          first_name?: string;
          last_name?: string;
          street?: string;
          street_2?: string | null;
          city?: string;
          postal_code?: string;
          country?: string;
          is_default?: boolean;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          logo_url: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          logo_url?: string | null;
          is_active?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category: ProductCategory;
          gender: ProductGender;
          brand_id: string | null;
          base_price: number;
          is_active: boolean;
          is_featured: boolean;
          requires_prescription: boolean;
          frame_shape: string | null;
          frame_material: string | null;
          frame_color: string | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          category: ProductCategory;
          gender?: ProductGender;
          brand_id?: string | null;
          base_price: number;
          is_active?: boolean;
          is_featured?: boolean;
          requires_prescription?: boolean;
          frame_shape?: string | null;
          frame_material?: string | null;
          frame_color?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          category?: ProductCategory;
          gender?: ProductGender;
          brand_id?: string | null;
          base_price?: number;
          is_active?: boolean;
          is_featured?: boolean;
          requires_prescription?: boolean;
          frame_shape?: string | null;
          frame_material?: string | null;
          frame_color?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          updated_at?: string;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string | null;
          color_name: string;
          color_hex: string | null;
          size: string | null;
          price_override: number | null;
          stock_quantity: number;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          sku?: string | null;
          color_name: string;
          color_hex?: string | null;
          size?: string | null;
          price_override?: number | null;
          stock_quantity?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          sku?: string | null;
          color_name?: string;
          color_hex?: string | null;
          size?: string | null;
          price_override?: number | null;
          stock_quantity?: number;
          is_active?: boolean;
        };
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          url: string;
          alt_text: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          url: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          product_id?: string;
          variant_id?: string | null;
          url?: string;
          alt_text?: string | null;
          sort_order?: number;
          is_primary?: boolean;
        };
      };
      lens_options: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          category: string;
          price: number;
          is_active: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          category: string;
          price?: number;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          category?: string;
          price?: number;
          is_active?: boolean;
          sort_order?: number;
        };
      };
      carts: {
        Row: {
          id: string;
          profile_id: string | null;
          session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id?: string | null;
          session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          profile_id?: string | null;
          session_id?: string | null;
          updated_at?: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          variant_id: string;
          quantity: number;
          lens_type: LensType | null;
          prescription_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          variant_id: string;
          quantity?: number;
          lens_type?: LensType | null;
          prescription_url?: string | null;
          created_at?: string;
        };
        Update: {
          cart_id?: string;
          variant_id?: string;
          quantity?: number;
          lens_type?: LensType | null;
          prescription_url?: string | null;
        };
      };
      cart_item_lens_options: {
        Row: {
          id: string;
          cart_item_id: string;
          lens_option_id: string;
        };
        Insert: {
          id?: string;
          cart_item_id: string;
          lens_option_id: string;
        };
        Update: {
          cart_item_id?: string;
          lens_option_id?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          profile_id: string;
          status: OrderStatus;
          delivery_method: DeliveryMethod;
          payment_method: PaymentMethod;
          subtotal: number;
          shipping_cost: number;
          total: number;
          stripe_payment_intent_id: string | null;
          alma_payment_id: string | null;
          shipping_first_name: string | null;
          shipping_last_name: string | null;
          shipping_street: string | null;
          shipping_street_2: string | null;
          shipping_city: string | null;
          shipping_postal_code: string | null;
          shipping_country: string | null;
          tracking_number: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number: string;
          profile_id: string;
          status?: OrderStatus;
          delivery_method: DeliveryMethod;
          payment_method: PaymentMethod;
          subtotal: number;
          shipping_cost?: number;
          total: number;
          stripe_payment_intent_id?: string | null;
          alma_payment_id?: string | null;
          shipping_first_name?: string | null;
          shipping_last_name?: string | null;
          shipping_street?: string | null;
          shipping_street_2?: string | null;
          shipping_city?: string | null;
          shipping_postal_code?: string | null;
          shipping_country?: string | null;
          tracking_number?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: OrderStatus;
          delivery_method?: DeliveryMethod;
          payment_method?: PaymentMethod;
          subtotal?: number;
          shipping_cost?: number;
          total?: number;
          stripe_payment_intent_id?: string | null;
          alma_payment_id?: string | null;
          shipping_first_name?: string | null;
          shipping_last_name?: string | null;
          shipping_street?: string | null;
          shipping_street_2?: string | null;
          shipping_city?: string | null;
          shipping_postal_code?: string | null;
          shipping_country?: string | null;
          tracking_number?: string | null;
          notes?: string | null;
          updated_at?: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string;
          product_name: string;
          variant_info: string | null;
          quantity: number;
          unit_price: number;
          lens_type: LensType | null;
          lens_options_summary: string | null;
          lens_options_price: number | null;
          prescription_url: string | null;
          prescription_validated: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id: string;
          product_name: string;
          variant_info?: string | null;
          quantity?: number;
          unit_price: number;
          lens_type?: LensType | null;
          lens_options_summary?: string | null;
          lens_options_price?: number | null;
          prescription_url?: string | null;
          prescription_validated?: boolean | null;
          created_at?: string;
        };
        Update: {
          variant_id?: string;
          product_name?: string;
          variant_info?: string | null;
          quantity?: number;
          unit_price?: number;
          lens_type?: LensType | null;
          lens_options_summary?: string | null;
          lens_options_price?: number | null;
          prescription_url?: string | null;
          prescription_validated?: boolean | null;
        };
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: OrderStatus;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: OrderStatus;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          order_id?: string;
          status?: OrderStatus;
          comment?: string | null;
        };
      };
      appointment_slots: {
        Row: {
          id: string;
          date: string;
          start_time: string;
          end_time: string;
          is_available: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          start_time: string;
          end_time: string;
          is_available?: boolean;
          created_at?: string;
        };
        Update: {
          date?: string;
          start_time?: string;
          end_time?: string;
          is_available?: boolean;
        };
      };
      appointments: {
        Row: {
          id: string;
          slot_id: string;
          profile_id: string;
          type: AppointmentType;
          status: AppointmentStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          profile_id: string;
          type: AppointmentType;
          status?: AppointmentStatus;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slot_id?: string;
          type?: AppointmentType;
          status?: AppointmentStatus;
          notes?: string | null;
          updated_at?: string;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string;
          cover_image_url: string | null;
          is_published: boolean;
          published_at: string | null;
          author_id: string | null;
          meta_title: string | null;
          meta_description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          excerpt?: string | null;
          content: string;
          cover_image_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          author_id?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          slug?: string;
          excerpt?: string | null;
          content?: string;
          cover_image_url?: string | null;
          is_published?: boolean;
          published_at?: string | null;
          author_id?: string | null;
          meta_title?: string | null;
          meta_description?: string | null;
          updated_at?: string;
        };
      };
      site_content: {
        Row: {
          id: string;
          key: string;
          value: string;
          content_type: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: string;
          content_type?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value?: string;
          content_type?: string;
          updated_at?: string;
        };
      };
      promotions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          discount_type: string;
          discount_value: number;
          code: string | null;
          is_active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          min_order_amount: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          code?: string | null;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          min_order_amount?: number | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          code?: string | null;
          is_active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          min_order_amount?: number | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      product_category: ProductCategory;
      product_gender: ProductGender;
      lens_type: LensType;
      order_status: OrderStatus;
      delivery_method: DeliveryMethod;
      payment_method: PaymentMethod;
      appointment_status: AppointmentStatus;
      appointment_type: AppointmentType;
      user_role: UserRole;
    };
  };
}

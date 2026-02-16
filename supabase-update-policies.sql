-- ═══════════════════════════════════════════════════════════════════════════════
-- MISE À JOUR DES POLICIES RLS POUR LES COMMANDES
-- À exécuter dans Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Ajouter la policy UPDATE pour les commandes
--    Permet aux utilisateurs de mettre à jour leurs propres commandes
--    (Nécessaire pour que l'API Alma puisse changer le statut après paiement)
-- ───────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can update own order status" ON orders;

CREATE POLICY "Users can update own order status" ON orders
FOR UPDATE 
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- FIN DE LA MISE À JOUR
-- ═══════════════════════════════════════════════════════════════════════════════

-- Note: Le statut "en_preparation" a été retiré du code.
-- Le nouveau workflow est:
--   en_attente_paiement → payee → expediee OU prete_en_boutique → livree
--
-- Quand l'admin:
--   - Ajoute un numéro de suivi: statut passe à "expediee" + email envoyé
--   - Marque "prete_en_boutique": email envoyé au client

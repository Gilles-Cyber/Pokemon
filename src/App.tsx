import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { useLocation, useNavigate } from 'react-router-dom';
import FavoritesPage from './pages/FavoritesPage';
import { supabase, hasSupabaseConfig } from './lib/supabase';

const LOGO_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuCN8pKHCJ2QqfK5aLW0p7I8X0LJYAlS29erglGedN1pZFXj-aou5iN2RpQI4o7zshjwouw6aTBWwvyjFtEtynkUIIZq91TsVd-IHHEDl5FwGW1Q003PpiCMQOAQn1wyRm6aGM9iEBUq-yxMXmWcDF8Okp8BXeqTN90D_xPWYMfWdxEfBMKS2xqLiNo4jxlxNsn70gsrHcVvOwa3uWASxEkbJxfT4IcTqIxeJgYyyEobh5niHZIo78A1LYStMHVLgKlxUPpcR-WZY6g";
const ADMIN_SHARED_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) || 'kemzeugillesparfait@gmail.com';
const ADMIN_SHARED_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD as string | undefined) || '123456';
const ADMIN_SESSION_CACHE_MS = 2 * 60 * 1000;
const HERO_PREMIUM_SLIDES = [
  {
    title: 'Pokemon 151 Collector Drop',
    subtitle: 'Original Kanto chase cards in a sealed premium run.',
    badge: 'Vault Drop',
    price: '$140+',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDEg0FL8fVF3SrWrTznZHG98V0sPOZFKZoks7X4cw79L0PPs5OHBPipPbUJpw_axQlbuoP5_65a3ODL92M1qnQ1ERZNgjpf47Fo6nd2sFw154XySCt_SgLH0DSJcGO98UvzFJsPon8JsPvLDVw-5Feds2U3EefB6-LJ_Io9751dm6oB2w0E_s440tYev3btEKmfVar2bk496cxCQkhcxcceSMGmzEEmr3fJavVLDhKUYm2iK5FQmag7DUYAPCJo4mz9TUTsRdktmf0'
  },
  {
    title: 'Evolving Skies Legacy',
    subtitle: 'High-demand packs with elite pull potential.',
    badge: 'Collector Favorite',
    price: '$450',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBooVJEPhWsiSijLZFSZR3LMNNGivN8QyaxJHifLde6MpoahT-eqNZf_FvE0ZnYgoMTgdm7wA285cAVmZjC9QM8lfU-oEDW-xqpMcoqSTGpm3hdqBtBIOjf965npqEjSSA3d5KzdyThV1YmBRHjRYSc1DRh0-sKvkfB9B1IewoOSN6fx70R-zAqCqgv_csFQN3aaumnq2c_KTooGgLNFXVr6sTu5EpWzcyeNbqyblIjlEFceYxV4VyePn50DZV9Pv7lty3p-QdhIos'
  },
  {
    title: 'Modern Heat Selection',
    subtitle: 'Obsidian Flames and Paldea Evolved in one premium wave.',
    badge: 'Trending',
    price: '$110+',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATY0O4QU6HrASu5KHXd11tu5SrdT5vtHbQn1jEywLhMGNRuotZNu5jrrmQWu8HHI1MUFPNpt4auaPkWzgPlzGc2QabK-mDXGa_Ce6wgn5YYYiDB6x_QMvrmTWQ4RhkCBhdNlebaEqEGlQAn2RRMqlCYK1MWXgvGSk3OOmk65beKRXAYjf0fX1FTgAGx6FMctDXLkmHhKBzb80trcifkr9lY9fB_HRxfHLFc-U5fn7bbnVlprZbXY15OECHnFdFctGB-M5Hq7rSS4w'
  },
  {
    title: 'Paldea Evolved Spotlight',
    subtitle: 'Fresh Scarlet & Violet wave with strong value pulls.',
    badge: 'Fresh Stock',
    price: '$125',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC4KwVqKSwPUGOlvjpreBqF-nNiXkv2OmviQFtWmIPVpZOcMiXeegrfQ62yWCU-3bHS2cF5GGbAyUQkcrFwLmwUdtSA3931NSlul9As2l-wjBNzvVhhzD2hRps__fqiny2OzCf9PWM8i6tBvvN52cxuYAji1HR8QigjvgJsUeihP0m8b2qSRXPLD8x_2evVN1Mbcsf6HZGvV6d7qSx_nKQOc8wKHXBWCKFntCcFl0-AAQBIZqLe8phZQoeiWCVeNL5fhjAHYoeOzH8'
  },
  {
    title: 'Lost Origin Edition',
    subtitle: 'Classic Sword & Shield energy with premium seal quality.',
    badge: 'Back In',
    price: '$130+',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4oTk3dgcQEusVci9TT_KbLwthf5aMOHcUZnkt_CwKyYT5QKdojOOc2j-MzL-aXOov-T0M8P11FPFhnuXCFPwC4HJohFtyyFGqJd_FG0sD0xE0Ncf6NgW41UexUwNwWLNE2dR6v8MdZ286PpPWREyX160yg3CL33FoArQ547CFisGfkV0zofgP8kv7nX6T57BMedIUIROzR1lCTwSedjDDWMjQExSZdpLTtoy2fCcIoBpNkNF0cr1IgBVnx1-OiFQPfv6ODOkwms0'
  },
  {
    title: 'Charizard Collector Case',
    subtitle: 'High-demand collector set for premium shelves.',
    badge: 'Hot Pick',
    price: '$135',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC26fAOHF9XTupH5f68zPpSav12fTxGPkFXaSkmgwUBYVpnCHo7d6hW7_U81Q5dPZ2HEuFCBHUT6H8hWgmLbfKAS27rfkwVFg7Je77kY0CTLT7zba0Pjx2YiFX6Mgd_1kuGX-5JVEiIbFqnA6J4fBndZxURdIkPqnjZd3caWzk666bIPtLz2bC_YPM0FwET_sJs_t94ch67rBN4PzpNB0LV18WUb7rP475Nz-WvAZ-Fz6W3WmtPv8hF7d7lAaE53wKxFtcXJGnk-Bk'
  },
  {
    title: 'Silver Tempest Reserve',
    subtitle: 'Battle-ready booster wave with consistent demand.',
    badge: 'Reserve',
    price: '$140',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYjsqDdpF3v7wftG_7lQHRh2WZ4tvV_Srd48m8STAdJ-0S8ZQ0y1IMybRhuZJ9H-MjUTXrDBo3CZIyIvQ4Vkoqtps0chaM4KNnXGV5F6RXaIC2vmHxD09dmHSVdmA9WzURCqYYRJG1dG-Bi9wbhcPIVMb4fgGWc2vqIij8GbVUtKPSxQ_qgX0hwzgcsmuqFL_RkbAs9hkDc3nGEiKFr33ggvpU8BB5tY-6J9treqvkn0A3zvuOY7AsnRnsSTO19gFzrPQtWX4ZMnY'
  },
  {
    title: 'Fusion Strike Vault',
    subtitle: 'Affordable sealed inventory with strong turnover.',
    badge: 'Value Pick',
    price: '$120',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHEjLhEPpxnSthwyM5vQvfjh_5gIP_hYeDuOopB0mcXHresollbu_hraDhjLt40vcZ5QAcM7YhbgPhcWPBqYIUrRUWSIwUlvZJGm_h-tnUFa_zOPY0CmmtQrSSAsPhWnMFL60VNo0R3UIWrvyt8v9e_LNdSprzSmgzEiNBbEaCVyDMShZwg1EySfbLjdtXik0vHIKjqxkY50oL-1xj3giFrl0_T9WbYA07FE5PBkJhvCAple5DoQRX-XvBgHaNXDih86WCmqJhao0'
  }
];

async function uploadFileToBucket(file: File, bucket: string, folder?: string): Promise<string | null> {
  try {
    if (!supabase) return null;
    const fileExt = (file.name.split('.').pop() || 'bin').toLowerCase();
    const randomPart = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const fileName = folder
      ? `${folder}/${randomPart}.${fileExt}`
      : `${randomPart}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

async function uploadImage(file: File): Promise<string | null> {
  const url = await uploadFileToBucket(file, 'products');
  if (!url) {
    emitToast('Failed to upload product image.', 'error');
  }
  return url;
}

async function uploadChatImage(file: File, threadId: string, userId: string | null, adminMode?: boolean): Promise<string | null> {
  const safeThreadId = threadId.replace(/[^a-zA-Z0-9-_]/g, '');
  const safeUserId = (userId || 'guest').replace(/[^a-zA-Z0-9-_]/g, '');
  const folder = adminMode ? `admin/${safeThreadId}` : `visitor/${safeUserId}/${safeThreadId}`;
  const url = await uploadFileToBucket(file, 'chat-media', folder);
  if (!url) {
    emitToast('Failed to upload chat image.', 'error');
  }
  return url;
}

function emitToast(message: string, type: 'success' | 'info' | 'error' = 'info') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
}

function emitAddToCart(productId: number) {
  window.dispatchEvent(new CustomEvent('app-add-to-cart', { detail: { productId } }));
}

interface Product {
  id: number;
  name: string;
  price: number;
  lang: string;
  image: string;
  series: string;
  isFavorite?: boolean;
  rating?: number;
  reviews?: number;
  description?: string;
  features?: string[];
  thumbnails?: string[];
  inStock?: boolean;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Silver Tempest Booster Box",
    price: 140,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDYjsqDdpF3v7wftG_7lQHRh2WZ4tvV_Srd48m8STAdJ-0S8ZQ0y1IMybRhuZJ9H-MjUTXrDBo3CZIyIvQ4Vkoqtps0chaM4KNnXGV5F6RXaIC2vmHxD09dmHSVdmA9WzURCqYYRJG1dG-Bi9wbhcPIVMb4fgGWc2vqIij8GbVUtKPSxQ_qgX0hwzgcsmuqFL_RkbAs9hkDc3nGEiKFr33ggvpU8BB5tY-6J9treqvkn0A3zvuOY7AsnRnsSTO19gFzrPQtWX4ZMnY",
    rating: 4.8,
    reviews: 92,
    description: "Uncover the mystery of the deep in the Silver Tempest Booster Box. This sealed box contains 36 booster packs, each offering a chance to pull rare Lugia VSTAR and Alolan Vulpix VSTAR cards.",
    features: ["100% Authentic Factory Sealed", "36 Booster Packs", "Chase Lugia VSTAR"],
    thumbnails: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD7H5JTLRLh3kwVckpKLfFLF_VZ8QXUvsw4Q9B1Mhxx9wzYq69bp1OcfMQ4voe1taIgqp666xnFzdXEmcQpDUkW1Ax2FNOL4etIokZLg--QMfvm6W-c6OvkqOcSXFujX7UZiFRztLhDHT42iLj-yS0jYvlWM6xV6jHSlCEyIVSPhtpIpALU6078XPWP-QH07G3NL1qDEUcia-3g3Obwh62Yz6ri5xNvhfU-XIorHS3ZPH5NeyonuYbFW8s9-XQtoX4kE-6UAzJF1Bk",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCuj2ROAdsVuhA6TWisBBCnY9YmjDVm-hPU8-7tAo98Lkf_OX_gO3KUpJZUuvrSS0TaWyOEEIrL7qMcMFSaGu9Kypc2Fc7p0X_8VoVQvtWR6zp5vDhNwIEwRij-rUhxOwnDVSJLSguziHM-mFBOdjAeuxdNNkh8Ts1UQQYPjJTtzqFdhUTT0M8_4MnNwINqyYX6IQ7H_l5tajLxT7c2VmvpfjOC-UVwlyz9OSZKM6HBKGJbKYitTrIRokCx0hUH_-l0napaH5h3BiQ"
    ],
    inStock: true
  },
  {
    id: 2,
    name: "Lost Origin Booster Box",
    price: 180,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBOe_AHLszFhNQdRC1O5HWJKuRHEfzG5fvTvyq99vXlI2wcWyq63T6YaadabCrCSYjQhOv--OCsNbOSNygIuS3qFaHWOY2SmuSyUDJKdr_G4FZnewOhe0-zxVh45iMcgqpqh9W1qP4-OEiGjn2QTuAV4Kht4zYOjhxABMp4p2PGRoqphTLHig8IVcAprbExw6iorW6S_Z6YASNZ6SZxqYWiw9V9J0kDSZZm2oVLCSQSfMCpENsMXfPL5VZQ5zrfRKSDIKPbDLxDbF8",
    inStock: true
  },
  {
    id: 3,
    name: "Brilliant Stars Booster Box",
    price: 160,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDQ2O0Oh30YCgRAr73tn-X-0UGdAxtj6Et9ejZBWOGVVc5Z4oFy5SGa6Gt6gPxSg14XE5iP9M5dKmHCukgQEYoMAldW7pZPbZW2Fh3nZXVCCxQ3lxnTTQsYBWdvBngP92O3gJfftMQbY-HEBFopGFlRGRLacDpIwQdV1UcBp85ecS-LrNqkKwv8ML-te4RxURdJArlMdKjAIaUmp1TSLTCJZ0o3iJQMLba4lm3xCZaW-_hlcm9YsAzeXBTvfbQl7OfokzlvisdpjCE",
    inStock: true
  },
  {
    id: 4,
    name: "Evolving Skies Booster Box",
    price: 450,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLwUdzjYX7qApwYRtaXuX3n_TmFUhQY4uP530toSh6JJF16OSgV_mA-YYt9luAegOavXC5SLSJkrdeOqfvw7UOH8EVKcTJxGjZikoWzCTyUK1FhnybTK33SrnUPwWLkq7AtoE-5cvMEy2nfIja-2tKjMrnnhSQGDqTyfERwQLj4IinAEkt_F1WR0APCz4HGBaP6sG1bauJx3yzPAgPRPS94ZfvlnUGLaapiYn1aJgnp0PbsbdFet5y5Ibm0PrO5CXglOmfDCiFrLw",
    inStock: false
  },
  {
    id: 5,
    name: "Fusion Strike Booster Box",
    price: 120,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBHEjLhEPpxnSthwyM5vQvfjh_5gIP_hYeDuOopB0mcXHresollbu_hraDhjLt40vcZ5QAcM7YhbgPhcWPBqYIUrRUWSIwUlvZJGm_h-tnUFa_zOPY0CmmtQrSSAsPhWnMFL60VNo0R3UIWrvyt8v9e_LNdSprzSmgzEiNBbEaCVyDMShZwg1EySfbLjdtXik0vHIKjqxkY50oL-1xj3giFrl0_T9WbYA07FE5PBkJhvCAple5DoQRX-XvBgHaNXDih86WCmqJhao0",
    inStock: true
  },
  {
    id: 6,
    name: "Chilling Reign Booster Box",
    price: 145,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAA9fmzTYBLiOysFKVKVowHPMO_ymIUs1nmNKHUGbc-6ZxMOx7TKsoRFHWowEzRi5BZjyLcovD2FOKn1kjtThh8RzxADpyQXDdXwS719aqX8tEhUroyN0lwyz6zce4SI9AA9XInKyw0CFDTeanTeiD8cM3J6JtQ3ED8FwD9TxSfAa1Ls5KSuG_14f8o-fUmgUY3m_qAwW2vNUmAclCoFEgzNdBBfQaPgcdt9HK6e6PNNeOESuVEvPstYIttb9NqhWxQNIKhgs2OP2I",
    isFavorite: true,
    inStock: true
  },
  {
    id: 7,
    name: "VMAX Climax Japanese Box",
    price: 110,
    lang: "Jpn",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBZIPxmrbgHLKJwa2Zr8mXCpKxS890q0f5_K7joqXn-Fa8J3iJJTw3nGXhLTp3o2P55OagFm2Ro6odlZ0TgCcaU_zj5KOK0ePdHvsycGvAbUqfciBz-crDaIAaZZVmLye6LqxjCVCvv3nHLNI7xjp1I0Jj7Lw1gazpB_plsCBtprjKYGcVQL4qJJTyHWgC7xBU5xrt-jyZWmwTh2TMRv6FsPqqirvZs-6sKfYeF2fmieybyFs43XgMjwonikp593BZ29FikUnK1FPI",
    inStock: true
  },
  {
    id: 8,
    name: "Vivid Voltage Booster Box",
    price: 130,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZpfU9IIDfISZRij9nq1zq5uIkiQQiG0F0gjHDcYmd8g3knG5_wobE0sCmm67VWqFDWq6aX967h0I4W67fddu1Pp8BhsaOYVIzV4J4UwqVl6j0IKyjcz_SKGoJqwzGOmS2neRER_Hb2Oyv7NgHcFUwt2HP0i8payi6oxypH1cv4sjs-WsR4vNycC2bAS_t7sRaLCaqgNpgya-Xhbfncki9pz2sEjsOTsIdVrsZdkEV3M8jAA3lkwQvK5iqVqOovDeU2YTUtqsKWbo",
    inStock: true
  },
  {
    id: 11,
    name: "151 Ultra Premium Collection",
    price: 119.99,
    lang: "Eng",
    series: "Scarlet & Violet",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAY_bpB95tDoe4tnRxhaKwnuIUbXFKeeUSr_0d17LN2M8DVR95SOWmu-dfzMC-l3zcwfcGtdI-dFdWYwofoXQhGoMiCn0N-9jlBuaFK7ekvalFoRc46VMSFArPwPzceS0ZgTu10KOKh0vBtdsKZrx8L6fx6ThiKVYKy-JK40maLzklCrsl0WpdqmOJ2pMFAQuAoI89xtDCoMYQGvkp2aRMgZg4fe43AkNnSZtuNykPqXd9DMESS9n07_kc7OaAkGJN5wX0yw9oyo9o",
    inStock: true
  },
  {
    id: 12,
    name: "Charizard UPC",
    price: 135.00,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC26fAOHF9XTupH5f68zPpSav12fTxGPkFXaSkmgwUBYVpnCHo7d6hW7_U81Q5dPZ2HEuFCBHUT6H8hWgmLbfKAS27rfkwVFg7Je77kY0CTLT7zba0Pjx2YiFX6Mgd_1kuGX-5JVEiIbFqnA6J4fBndZxURdIkPqnjZd3caWzk666bIPtLz2bC_YPM0FwET_sJs_t94ch67rBN4PzpNB0LV18WUb7rP475Nz-WvAZ-Fz6W3WmtPv8hF7d7lAaE53wKxFtcXJGnk-Bk",
    inStock: true
  },
  {
    id: 13,
    name: "Scarlet & Violet: 151 Booster Box",
    price: 140.00,
    lang: "Jpn",
    series: "Scarlet & Violet",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDEg0FL8fVF3SrWrTznZHG98V0sPOZFKZoks7X4cw79L0PPs5OHBPipPbUJpw_axQlbuoP5_65a3ODL92M1qnQ1ERZNgjpf47Fo6nd2sFw154XySCt_SgLH0DSJcGO98UvzFJsPon8JsPvLDVw-5Feds2U3EefB6-LJ_Io9751dm6oB2w0E_s440tYev3btEKmfVar2bk496cxCQkhcxcceSMGmzEEmr3fJavVLDhKUYm2iK5FQmag7DUYAPCJo4mz9TUTsRdktmf0",
    rating: 4.9,
    reviews: 128,
    description: "Relive the original Kanto journey with the Scarlet & Violet: 151 Booster Box. This sealed box contains 36 booster packs, each offering a chance to pull rare illustration cards of the original 151 Pokémon including Charizard ex, Blastoise ex, and Venusaur ex.",
    features: [
      "100% Authentic Factory Sealed Guarantee. Direct from distributor.",
      "Includes 36 Booster Packs per box.",
      "Chase rare Illustration Rares & Special Illustration Rares."
    ],
    thumbnails: [
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAO7GWKsD6tObmZxAi_owQSpzZqgP82zmrX_RwcG_c-D57F4o16o-EnYVy7gADjZy0URXyNzC9pL1o7RvcSfyuW_I9x_JgNy5HssGAn5tCc8UwCINYiQPQdz5lZ-FHUg-szUuM4pTI7Vigmq4-zdLwDdowzkyF9yj0YLdU2zrQrQzRJtKFMH_m_mEZv6L_iGWfp82WY9s_fOH2X0pKSm3M04YvXXdhs0av9m2v8g_e5gVHd705fUEpiQCpXDqIV2agjsMvz2lA6CCo",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBUnyT9D-9dyyh5oc9TS1TcfkmUdaHH6XYUZjqubXLQrBJIzO7_vCdsYgy96zQpTzMV4eecRAzdsgIqEMDp8-l2Vq2cOJEWfjw-BGWgK2n7j5AhFlm1BDX_tNp2nP9Tnh_zF1LOJIbN476O3_J6MLk8QCYMAfjCPPpeFwY-JFbYfv2TUadsM2z6uTHLSz5B2to_XcUaYBtYQglvb9R5Msnbvi9rivTn12cewxlxEI6KAUnedQgfDSHdfUMePtQQeZeSOQgyH-mWuW8",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCuj2ROAdsVuhA6TWisBBCnY9YmjDVm-hPU8-7tAo98Lkf_OX_gO3KUpJZUuvrSS0TaWyOEEIrL7qMcMFSaGu9Kypc2Fc7p0X_8VoVQvtWR6zp5vDhNwIEwRij-rUhxOwnDVSJLSguziHM-mFBOdjAeuxdNNkh8Ts1UQQYPjJTtzqFdhUTT0M8_4MnNwINqyYX6IQ7H_l5tajLxT7c2VmvpfjOC-UVwlyz9OSZKM6HBKGJbKYitTrIRokCx0hUH_-l0napaH5h3BiQ",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC7P3b4F19zHkW1zrzQ9Yvmc2W69qUcYzD03Pvs_pLO75XYzEqN5b-v6yhatcfZvUmAPbQ1dQEbSFM9uHkCuEEeaD3WqnvgbR7SaYPkT5V-5b6bMfROh9YyxAu6O_q-m4XxjzTuk3b2VPyCRy0sozOC9rud6Fbsz8JuxVtLRiXKdAMz0ifClvYGptWF79BUlzJA0i8dAteFAHgLSdpED1snu47hfdQVj29CvB-FxV1C5yhr3U0e6FvehEhnKEgn-ercAgI96-uy0j8",
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCL28auKhuPEs2IIlXfIwC17D9FCo7XB6ppZpsjJ6oF6YMdlpx9gwqv_xhjZUcTmLk0xDx0iNV2OdKIgnaGQDxCc6PiVbaou1MyZ8fbJbA-YaukOCtR6llaMe6nZ-lX3bdBZVFe0xzul6pXibm5Onehf2IgVO6ZrUiN2bbZNTOQGHPXBBjFSX_pXQGu_0oAErFZnDLsrFL_BFDTo5NiS2GQpITssSmRnw0LEX6wEe2vbbjglppUHs4mxeV8C5gTr1nM09DnsCV997I"
    ],
    inStock: true
  },
  {
    id: 14,
    name: "Evolving Skies Booster Box",
    price: 450.00,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBooVJEPhWsiSijLZFSZR3LMNNGivN8QyaxJHifLde6MpoahT-eqNZf_FvE0ZnYgoMTgdm7wA285cAVmZjC9QM8lfU-oEDW-xqpMcoqSTGpm3hdqBtBIOjf965npqEjSSA3d5KzdyThV1YmBRHjRYSc1DRh0-sKvkfB9B1IewoOSN6fx70R-zAqCqgv_csFQN3aaumnq2c_KTooGgLNFXVr6sTu5EpWzcyeNbqyblIjlEFceYxV4VyePn50DZV9Pv7lty3p-QdhIos",
    inStock: true
  },
  {
    id: 15,
    name: "Lost Origin Booster Box English",
    price: 130.00,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA4oTk3dgcQEusVci9TT_KbLwthf5aMOHcUZnkt_CwKyYT5QKdojOOc2j-MzL-aXOov-T0M8P11FPFhnuXCFPwC4HJohFtyyFGqJd_FG0sD0xE0Ncf6NgW41UexUwNwWLNE2dR6v8MdZ286PpPWREyX160yg3CL33FoArQ547CFisGfkV0zofgP8kv7nX6T57BMedIUIROzR1lCTwSedjDDWMjQExSZdpLTtoy2fCcIoBpNkNF0cr1IgBVnx1-OiFQPfv6ODOkwms0",
    inStock: true
  },
  {
    id: 16,
    name: "Paldea Evolved Booster Box",
    price: 125.00,
    lang: "Eng",
    series: "Scarlet & Violet",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4KwVqKSwPUGOlvjpreBqF-nNiXkv2OmviQFtWmIPVpZOcMiXeegrfQ62yWCU-3bHS2cF5GGbAyUQkcrFwLmwUdtSA3931NSlul9As2l-wjBNzvVhhzD2hRps__fqiny2OzCf9PWM8i6tBvvN52cxuYAji1HR8QigjvgJsUeihP0m8b2qSRXPLD8x_2evVN1Mbcsf6HZGvV6d7qSx_nKQOc8wKHXBWCKFntCcFl0-AAQBIZqLe8phZQoeiWCVeNL5fhjAHYoeOzH8",
    inStock: true,
    rating: 4.7,
    reviews: 45,
    description: "Paldea Evolved brings the first partner Pokémon of the Paldea region to the TCG. This set features powerful new Pokémon ex and beautiful illustration rare cards.",
    features: ["36 Booster Packs", "Paldea Region Debut", "Illustration Rares"]
  },
  {
    id: 17,
    name: "Obsidian Flames Booster Box",
    price: 110.00,
    lang: "Eng",
    series: "Scarlet & Violet",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuATY0O4QU6HrASu5KHXd11tu5SrdT5vtHbQn1jEywLhMGNRuotZNu5jrrmQWu8HHI1MUFPNpt4auaPkWzgPlzGc2QabK-mDXGa_Ce6wgn5YYYiDB6x_QMvrmTWQ4RhkCBhdNlebaEqEGlQAn2RRMqlCYK1MWXgvGSk3OOmk65beKRXAYjf0fX1FTgAGx6FMctDXLkmHhKBzb80trcifkr9lY9fB_HRxfHLFc-U5fn7bbnVlprZbXY15OECHnFdFctGB-M5Hq7rSS4w",
    inStock: true,
    rating: 4.6,
    reviews: 38,
    description: "Red-hot embers illuminate the pitch-black night and sparks flare into an inferno as Charizard ex surges forth with newfound powers of darkness!",
    features: ["36 Booster Packs", "Type-Shifted Tera Pokémon ex", "Charizard ex Chase"]
  },
  {
    id: 18,
    name: "Astral Radiance Booster Box",
    price: 99.00,
    lang: "Eng",
    series: "Sword & Shield",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQX6l5PxeA3f3r_-4o-5Xu0QNzLC-VM3jSlyaz1aAev67mPdr7uhR-fSdYiUojEZjQY_2H_fIJ4nTyVuRHhnYpU5237QMKNzzo1CSWmbCugXDMTb2bvpWE8wCVHzQFZE4Gqe0wrUca1ncP_fg8TGHLq2A1Ub_BjeO79PQtQxLRf4zzlkIrHWWNVPObRnd4JXwH8oUJiVGwNKbWVgQpSRr8Ryn8m7jYBv_Usqc8sVwF_D-g6z4VX6MNxBmQdiTIZ7wOepQc32DCCns",
    inStock: true,
    rating: 4.5,
    reviews: 52,
    description: "Travel back to a land of myths, legends, and wilderness as Origin Forme Dialga VSTAR and Origin Forme Palkia VSTAR shape the very fabric of time and space!",
    features: ["36 Booster Packs", "Origin Forme VSTARs", "Hisuian Region Focus"]
  },
  {
    id: 19,
    name: "Skyridge Booster Box",
    price: 45000.00,
    lang: "Eng",
    series: "Vintage",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuArsSwDAgYjbP0qJUwbWDdjronk6f1Qq0qjYozYeEEh5LZOI2_CfApOYh4FPwcJxcc0DaQP4hVuTCPzm-KRUJy9GNdT0gHSat7DQkhJpncbb4mKy13-HHPNDvVGx1s2Wr3e2aAoM2NSvm2iOeOd1Qx80VTV3Cy-j70yGCG5DYQjuGAsy0UZNaVLk4IOLjUywhYaafyL10ZTEP0KrjnpIkvC_zIUpKymGrM_4qdvv0hj5CtH-MMPPcnJQKJwh6UfHLKVy1HIc-kV9bg",
    inStock: true,
    rating: 5.0,
    reviews: 12,
    description: "The final set produced by Wizards of the Coast. A legendary masterpiece for any serious collector. Features the iconic Crystal Pokémon.",
    features: ["Factory Sealed", "Wizards of the Coast Era", "Crystal Pokémon Chase"]
  },
  {
    id: 20,
    name: "Base Set (Unlimited) Booster Box",
    price: 15000.00,
    lang: "Eng",
    series: "Vintage",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBu3Q_G81gKl6hjWgJ2Bc7g19Dn2Zx7vc-o52fwase-txCqXMBfpF6FIvA1tHYcHGzH2pNglVpR2huxG24j88almRA7zVh4bhpGsMaM-xAlnu3VHI_zpT4qMXIXZMSamm97ChOb4oXvgjo2C061wbOsildWlEidhQKP6dlPM0xji124x9NwCDFWUOh4wwuD_nZX8hutgdn_g_uwTlRb6QPMNEZgqT27Z1fLZNPDIn1jB0DI96SV4qenNjuqKbAEPzVIIjI9wwsDChQ",
    inStock: true,
    rating: 5.0,
    reviews: 25,
    description: "Where it all began. The original 1999 Base Set booster box. A piece of history containing the most iconic cards in the franchise.",
    features: ["Original 1999 Release", "36 Booster Packs", "Charizard Chase"]
  },
  {
    id: 21,
    name: "Fossil First Edition Booster Box",
    price: 8500.00,
    lang: "Eng",
    series: "Vintage",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzYr2BT2ZXqpQOFJgFYtgbDIa2OyAOZed2AAiv5WIbuQ5DQwj47tVquEIeOU6PHh369InEAoeNaMO4viV3j-DtwJ8j3zgiSA1yfPMIDFxVhNAFLvMORCBFyMvb2tRKU09SZjNc1pABGvC_6tP9HsVK50ZuJ3BhJdlmKNwPwMIqJGYvvrxAmq7bdKtgC2NQDh3Qu-H9InSp6fR5SUsZRLaIHzJT8Fw1bdHyXP3u5vZOAv_0iSXko74vMRrXvJWgvq8X_EfTroOxsFg",
    inStock: true,
    rating: 4.9,
    reviews: 18,
    description: "The third expansion of the Pokémon TCG. This First Edition box is a rare find from the earliest days of the game.",
    features: ["First Edition Stamp", "36 Booster Packs", "Legendary Birds"]
  },
  {
    id: 22,
    name: "Aquapolis Booster Box",
    price: 22000.00,
    lang: "Eng",
    series: "Vintage",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCQX6l5PxeA3f3r_-4o-5Xu0QNzLC-VM3jSlyaz1aAev67mPdr7uhR-fSdYiUojEZjQY_2H_fIJ4nTyVuRHhnYpU5237QMKNzzo1CSWmbCugXDMTb2bvpWE8wCVHzQFZE4Gqe0wrUca1ncP_fg8TGHLq2A1Ub_BjeO79PQtQxLRf4zzlkIrHWWNVPObRnd4JXwH8oUJiVGwNKbWVgQpSRr8Ryn8m7jYBv_Usqc8sVwF_D-g6z4VX6MNxBmQdiTIZ7wOepQc32DCCns",
    inStock: true,
    rating: 4.9,
    reviews: 15,
    description: "Part of the e-Card series, Aquapolis is known for its beautiful art and unique card designs. A true collector's item.",
    features: ["e-Reader Compatible", "Crystal Lugia Chase", "Unique Art Style"]
  },
  {
    id: 23,
    name: "Neo Discovery Booster Box",
    price: 12500.00,
    lang: "Eng",
    series: "Vintage",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-Klgd8n9EOYGtDEhZh3-lMpscD27tlv7S9F2VoNKGtiz_H5DQBl8Rayvm-xD73e_e_waYjERK3_GxFxFBlrT366wS6tQQo4p28IVCPlqrpJ1olAQVIp5oOF853N_9MgbxU6lv6bRciA4jQ52ZhmMcic953X2611qKaD-osIB7lWm5wicXQim9sfNMTKaOIDBSFYyl9euwrMUFWc6w52NsHeeHF8KiyWsb534SYMfs8LwvUoGxePyDt6NubrDt43csrJtINbxYmFw",
    inStock: true,
    rating: 4.8,
    reviews: 20,
    description: "The second set in the Neo series, introducing many Generation II Pokémon to the TCG. Features the mysterious Unown.",
    features: ["Neo Series", "Gen II Pokémon", "Espeon & Umbreon Holos"]
  },
  {
    id: 24,
    name: "Gym Heroes Booster Box",
    price: 10250.00,
    lang: "Eng",
    series: "Vintage",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuC4KwVqKSwPUGOlvjpreBqF-nNiXkv2OmviQFtWmIPVpZOcMiXeegrfQ62yWCU-3bHS2cF5GGbAyUQkcrFwLmwUdtSA3931NSlul9As2l-wjBNzvVhhzD2hRps__fqiny2OzCf9PWM8i6tBvvN52cxuYAji1HR8QigjvgJsUeihP0m8b2qSRXPLD8x_2evVN1Mbcsf6HZGvV6d7qSx_nKQOc8wKHXBWCKFntCcFl0-AAQBIZqLe8phZQoeiWCVeNL5fhjAHYoeOzH8",
    inStock: true,
    rating: 4.8,
    reviews: 22,
    description: "Focuses on the Kanto Gym Leaders and their signature Pokémon. A nostalgic trip back to the original anime and games.",
    features: ["Gym Leader Pokémon", "Iconic Holos", "WOTC Classic"]
  },
  {
    id: 25,
    name: "Jungle (No Symbol) Booster Box",
    price: 9800.00,
    lang: "Eng",
    series: "Vintage",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDoNrjC2wPoQH34AYmU2KF-XozHbQiDygDsNtiUwsacYq-fs9IbuBFbPTnRJFn6AML2Iy-mSKabpSSjs-80Vr4NhGEPp7BsNjAxnw04LkP5LKlBfAaVwORvw-4cwHnOzrKegYCJgTueShr4CoKtVxGFWIaqmTCql6ys2S-r9mEmjyJSFZasHjhdYXs8EaHiw4gBHocDJ6pBdHHecwxXTpTmhZeuiE0R_fPpCpY0IfH50LYf_cMDr37_XoWgT3yLH6oGLpqo3ts9ZUc",
    inStock: true,
    rating: 4.7,
    reviews: 15,
    description: "A rare error print run of the Jungle set where the expansion symbol is missing from holo cards. A unique piece of history.",
    features: ["Error Print Run", "No Symbol Holos", "Extremely Rare"]
  },
  {
    id: 26,
    name: "Sun & Moon: Team Up Booster Box",
    price: 140.00,
    lang: "Eng",
    series: "Sun & Moon",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBb_ZTVCqdi-qWbgyr4dgu-J_EkPmViLb8-7FlCtKEjQoe5Y9NzYQO3212fBT1mxDHRbOQjAgJBfFR-IRDyiE_xF4u-0J2tIlJG_0QxML9UArYgSoa3SVZJgP1SsmOZvGdPkUfNubFiYgLp-1g83C-h7eHi_31_G5vQHtPTbXxj-8VEinq-pMexzAP5XdDHq3ntrqIfklHq_4Snp3Vm_JD01s_Hu8d5s78-YJvyeZUKIxPDU4D_A7UyPSJDBLUPFRmW9761tDNY9kU",
    inStock: true,
    rating: 4.9,
    reviews: 65,
    description: "Pokémon-GX team up for battle! This set features massive Tag Team Pokémon-GX with incredible power.",
    features: ["Tag Team GX", "36 Booster Packs", "Latias & Latios Chase"]
  },
  {
    id: 27,
    name: "Sun & Moon: Unified Minds Booster Box",
    price: 450.00,
    lang: "Eng",
    series: "Sun & Moon",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBxylXo0yARhd9EpABUW1UPaOBtmfAcRvHywbUu8I04moixpyucE19hzW7qjeAGIJ5W-0T8U8VW-XYHVZFMI4edworeX6ZS2aQVgpneYZiQiyljCEoggXsgCrUHEFbWwKXn7T96-6HqWRoXTP2xttaDUjnfkxshBKPCIhY8jb56X05XcMbBfHJ-swG1L5kmcTHXOTcWYsBVQ-GgN_m-3d4reiLe4HieH8omdTJSHliz1XQ_jpkBdfx6dA9AJw_o5D6W5G5z2Jco9aA",
    inStock: true,
    rating: 4.8,
    reviews: 42,
    description: "To stay on top, your team must work as one! Unified Minds features more Tag Team Pokémon-GX and powerful new trainers.",
    features: ["Tag Team GX", "Mewtwo & Mew Chase", "36 Booster Packs"]
  }
];

const CATEGORIES = ["All", "Modern", "Vintage", "Japanese", "Singles"];
const SERIES_FILTERS = ["All Sets", "Sword & Shield", "Scarlet & Violet", "Sun & Moon", "Vintage"];

interface CartItem {
  productId: number;
  quantity: number;
}

type View = 'home' | 'favorites' | 'search' | 'settings' | 'admin' | 'chat' | 'cart' | 'product-detail' | 'orders' | 'payment';

type ToastType = 'success' | 'info' | 'error';

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type LocalOrderItem = {
  productId: number;
  quantity: number;
};

type LocalOrder = {
  id: string;
  createdAt: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  items: LocalOrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

const STORAGE_KEYS = {
  favorites: 'ctcg:v1:favorites',
  cart: 'ctcg:v1:cart',
  notifications: 'ctcg:v1:notifications',
  orders: 'ctcg:v1:orders',
} as const;

type ChatMessage = {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  is_admin: boolean;
  image_url?: string;
};

type DisplayOrder = {
  id: string;
  date: string;
  name: string;
  price: number;
  status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  image: string;
  tracking?: {
    status: string;
    progress: number;
    steps: string[];
  };
  message?: string;
};

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function safeLocalStorageGet<T>(key: string): T | null {
  try {
    return safeJsonParse<T>(window.localStorage.getItem(key));
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSeries, setActiveSeries] = useState("All Sets");
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(false);

  const PRODUCTS = React.useMemo(() => {
    // Merge mock + DB by id; DB wins, but fallback to mock media/text when DB fields are empty.
    const mockById = new Map(MOCK_PRODUCTS.map((p) => [Number(p.id), p]));
    const mergedIds = new Set<number>([
      ...MOCK_PRODUCTS.map((p) => Number(p.id)),
      ...dbProducts.map((p) => Number(p.id)),
    ]);

    return Array.from(mergedIds).map((id) => {
      const mock = mockById.get(id);
      const db = dbProducts.find((p) => Number(p.id) === id);

      const image = db?.image || mock?.image || '';
      const thumbnails = (db?.thumbnails && db.thumbnails.length > 0)
        ? db.thumbnails
        : (mock?.thumbnails && mock.thumbnails.length > 0 ? mock.thumbnails : [image]);

      return {
        ...(mock ?? {}),
        ...(db ?? {}),
        id,
        image,
        thumbnails,
        description: db?.description || mock?.description,
        features: (db?.features && db.features.length > 0) ? db.features : (mock?.features ?? []),
      } as Product;
    });
  }, [dbProducts]);

  const [favorites, setFavorites] = useState<number[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState({
    priceDrop: true,
    orderStatus: true,
    newArrivals: false
  });
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  // Flags to prevent sync from running before initial fetch from DB completes
  const favoritesLoadedRef = useRef(false);
  const cartLoadedRef = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userUnreadChats, setUserUnreadChats] = useState(0);
  const [logoClicks, setLogoClicks] = useState(0);
  const [showAdminPinGate, setShowAdminPinGate] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(() => {
    try {
      return window.sessionStorage.getItem('ctcg:v1:admin_unlocked') === '1';
    } catch {
      return false;
    }
  });
  const [settingsFromAdmin, setSettingsFromAdmin] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      return (window.localStorage.getItem('ctcg:v1:theme') as 'light' | 'dark') || 'light';
    } catch {
      return 'light';
    }
  });

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    window.localStorage.setItem('ctcg:v1:theme', newTheme);
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [heroSlide, setHeroSlide] = useState(0);
  const [cartFlyFx, setCartFlyFx] = useState<Array<{
    id: number;
    image: string;
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }>>([]);
  const toastIdRef = useRef(1);
  const suppressAdminPinPromptRef = useRef(false);
  const adminSessionValidatedAtRef = useRef(0);
  const adminSessionPromiseRef = useRef<Promise<boolean> | null>(null);
  const visitorTrackedRef = useRef(false);

  const showToast = (message: string, type: ToastType = 'info') => {
    const nextId = toastIdRef.current++;
    setToasts((t) => [...t, { id: nextId, message, type }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== nextId));
    }, 2500);
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/', { replace: true });
  };

  const ensureAdminSession = async (options?: { force?: boolean }): Promise<boolean> => {
    if (!supabase || !hasSupabaseConfig) return false;

    if (!options?.force && adminSessionPromiseRef.current) {
      return adminSessionPromiseRef.current;
    }

    const run = async () => {
      const normalizedAdminEmail = ADMIN_SHARED_EMAIL.trim().toLowerCase();
      const password = ADMIN_SHARED_PASSWORD.trim();
      if (!normalizedAdminEmail || !password) {
        showToast('Admin credentials are missing. Set VITE_ADMIN_EMAIL and VITE_ADMIN_PASSWORD.', 'error');
        return false;
      }

      try {
        if (!options?.force && Date.now() - adminSessionValidatedAtRef.current < ADMIN_SESSION_CACHE_MS) {
          return true;
        }

        const verifyAdminRole = async () => {
          const { data, error } = await supabase.rpc('is_admin');
          return !error && Boolean(data);
        };

        const { data: current } = await supabase.auth.getSession();
        const currentEmail = current.session?.user?.email?.toLowerCase() ?? '';
        if (current.session?.user && currentEmail === normalizedAdminEmail) {
          const isAdmin = await verifyAdminRole();
          if (isAdmin) {
            adminSessionValidatedAtRef.current = Date.now();
            return true;
          }
          showToast('Signed in, but this account is not in admin_users.', 'error');
          adminSessionValidatedAtRef.current = 0;
          return false;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedAdminEmail,
          password
        });
        if (error || !data.user) {
          showToast('Admin sign-in failed. Check credentials and admin account setup.', 'error');
          adminSessionValidatedAtRef.current = 0;
          return false;
        }

        const isAdmin = await verifyAdminRole();
        if (isAdmin) {
          adminSessionValidatedAtRef.current = Date.now();
          return true;
        }
        showToast('Signed in, but this account is not in admin_users.', 'error');
        adminSessionValidatedAtRef.current = 0;
        return false;
      } catch (err) {
        console.error('ensureAdminSession error:', err);
        showToast('Unable to start admin session.', 'error');
        adminSessionValidatedAtRef.current = 0;
        return false;
      }
    };

    const promise = run().finally(() => {
      adminSessionPromiseRef.current = null;
    });
    adminSessionPromiseRef.current = promise;
    return promise;
  };

  const openAdminDashboard = async () => {
    if (!adminUnlocked) {
      setShowAdminPinGate(true);
      return;
    }
    navigate('/admin');
    const ok = await ensureAdminSession();
    if (!ok) {
      setShowAdminPinGate(true);
      navigate('/', { replace: true });
    }
  };

  const exitAdminMode = async () => {
    suppressAdminPinPromptRef.current = true;
    setAdminUnlocked(false);
    setShowAdminPinGate(false);
    try {
      window.sessionStorage.removeItem('ctcg:v1:admin_unlocked');
    } catch {
      // ignore
    }
    if (supabase) {
      await supabase.auth.signOut();
    }
    navigate('/', { replace: true });
  };

  const navigateToView = (view: View) => {
    switch (view) {
      case 'home':
        navigate('/');
        return;
      case 'favorites':
        navigate('/favorites');
        return;
      case 'cart':
        navigate('/cart');
        return;
      case 'orders':
        navigate('/orders');
        return;
      case 'settings':
        setSettingsFromAdmin(currentView === 'admin');
        navigate('/settings');
        return;
      case 'chat':
        navigate('/chat');
        return;
      case 'admin':
        void openAdminDashboard();
        return;
      case 'payment':
        navigate('/payment');
        return;
      case 'search':
        navigate('/search');
        return;
      case 'product-detail':
        navigate(selectedProductId ? `/product/${selectedProductId}` : '/');
        return;
      default:
        navigate('/');
    }
  };

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ message: string; type: ToastType }>;
      if (ce.detail?.message) {
        showToast(ce.detail.message, ce.detail.type ?? 'info');
      }
    };
    window.addEventListener('app-toast', handler as EventListener);
    return () => window.removeEventListener('app-toast', handler as EventListener);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ productId: number }>;
      if (typeof ce.detail?.productId === 'number') {
        const productId = ce.detail.productId;
        const name = PRODUCTS.find(p => p.id === productId)?.name;
        showToast(`Added${name ? ` ${name}` : ''} to cart`, 'success');
        setCart(prev => {
          const existing = prev.find(item => item.productId === productId);
          if (existing) {
            return prev.map(item =>
              item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
            );
          }
          return [...prev, { productId, quantity: 1 }];
        });
      }
    };
    window.addEventListener('app-add-to-cart', handler as EventListener);
    return () => window.removeEventListener('app-add-to-cart', handler as EventListener);
  }, []);

  useEffect(() => {
    const storedFavorites = safeLocalStorageGet<number[]>(STORAGE_KEYS.favorites);
    const storedCart = safeLocalStorageGet<CartItem[]>(STORAGE_KEYS.cart);
    const storedNotifications = safeLocalStorageGet<typeof notifications>(STORAGE_KEYS.notifications);
    const storedOrders = safeLocalStorageGet<LocalOrder[]>(STORAGE_KEYS.orders);

    if (Array.isArray(storedFavorites)) {
      setFavorites(storedFavorites.filter((id) => typeof id === 'number'));
    }
    if (Array.isArray(storedCart)) {
      setCart(
        storedCart
          .filter((x) => x && typeof x.productId === 'number' && typeof x.quantity === 'number')
          .map((x) => ({ productId: x.productId, quantity: Math.max(1, Math.floor(x.quantity)) }))
      );
    }
    if (storedNotifications && typeof storedNotifications === 'object') {
      setNotifications((prev) => ({
        ...prev,
        ...(storedNotifications as any),
      }));
    }
    if (Array.isArray(storedOrders)) {
      setOrders(
        storedOrders.filter((o) =>
          o &&
          typeof o.id === 'string' &&
          typeof o.createdAt === 'number' &&
          Array.isArray(o.items) &&
          typeof o.subtotal === 'number' &&
          typeof o.shipping === 'number' &&
          typeof o.tax === 'number' &&
          typeof o.total === 'number'
        )
      );
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch orders from Supabase
  useEffect(() => {
    if (!supabase || !hasSupabaseConfig || !userId) return;

    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      if (data) {
        const transformedOrders: LocalOrder[] = data.map((o: any) => ({
          id: o.id,
          createdAt: new Date(o.created_at).getTime(),
          items: (o.order_items || []).map((i: any) => ({
            productId: i.product_id,
            quantity: i.quantity
          })),
          subtotal: Number(o.subtotal ?? 0),
          shipping: o.shipping || 0,
          tax: o.tax || 0,
          total: Number(o.total ?? 0),
          status: (o.status as any) || 'Processing',
        }));
        setOrders(transformedOrders);
        safeLocalStorageSet(STORAGE_KEYS.orders, transformedOrders);
      }
    };

    fetchOrders();
  }, [userId]);

  useEffect(() => {
    if (!supabase || !hasSupabaseConfig) return;

    let isMounted = true;

    const fetchProducts = async () => {
      setIsProductsLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching products:', error);
          showToast('Failed to load products from database', 'error');
          return;
        }

        if (isMounted && data) {
          const mapped: Product[] = data.map(p => ({
            id: Number(p.id),
            name: p.name,
            price: Number(p.price),
            lang: p.lang,
            image: p.image,
            series: p.series,
            rating: p.rating,
            reviews: p.reviews,
            description: p.description,
            features: p.features,
            thumbnails: p.thumbnails,
            inStock: p.in_stock
          }));
          setDbProducts(mapped);
        }
      } finally {
        if (isMounted) setIsProductsLoading(false);
      }
    };

    void fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase || !userId) return;
    let pollTimer: number | null = null;

    const computeUnread = async () => {
      const { data: threads } = await supabase
        .from('chat_threads')
        .select('id,last_user_read_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (!threads || threads.length === 0) {
        setUserUnreadChats(0);
        return;
      }

      const threadIds = threads.map((t) => t.id);
      const { data: adminMessages } = await supabase
        .from('chat_messages')
        .select('thread_id,created_at')
        .in('thread_id', threadIds)
        .eq('sender', 'admin')
        .order('created_at', { ascending: true });

      const threadReadAt = new Map<string, number>();
      threads.forEach((t: any) => {
        threadReadAt.set(String(t.id), t.last_user_read_at ? new Date(t.last_user_read_at).getTime() : 0);
      });

      const unreadCount = (adminMessages ?? []).filter((m: any) => {
        const readAt = threadReadAt.get(String(m.thread_id)) ?? 0;
        return new Date(m.created_at).getTime() > readAt;
      }).length;
      setUserUnreadChats(unreadCount);
    };

    void computeUnread();

    const channel = supabase
      .channel(`user_chat_unread:${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        void computeUnread();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_threads' }, () => {
        void computeUnread();
      })
      .subscribe();

    // Fast fallback when realtime is slow on some mobile networks.
    pollTimer = window.setInterval(() => {
      void computeUnread();
    }, 700);

    return () => {
      if (pollTimer) window.clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!supabase || !userId || currentView !== 'chat') return;
    const markAllUserThreadsRead = async () => {
      await supabase
        .from('chat_threads')
        .update({ last_user_read_at: new Date().toISOString() })
        .eq('user_id', userId);
      setUserUnreadChats(0);
    };
    void markAllUserThreadsRead();
  }, [currentView, userId]);

  const saveProduct = async (p: Partial<Product>) => {
    if (!supabase || !hasSupabaseConfig) return;

    try {
      if (p.id) {
        // Update
        const { error } = await supabase
          .from('products')
          .update({
            name: p.name,
            price: p.price,
            lang: p.lang,
            image: p.image,
            series: p.series,
            rating: p.rating,
            reviews: p.reviews,
            description: p.description,
            features: p.features,
            thumbnails: p.thumbnails,
            in_stock: p.inStock
          })
          .eq('id', p.id);
        if (error) throw error;
        showToast('Product updated successfully', 'success');
        setDbProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, ...p } as Product : prod));
      } else {
        // Insert
        const { data, error } = await supabase
          .from('products')
          .insert([{
            name: p.name,
            price: p.price,
            lang: p.lang,
            image: p.image,
            series: p.series,
            rating: p.rating,
            reviews: p.reviews,
            description: p.description,
            features: p.features,
            thumbnails: p.thumbnails,
            in_stock: p.inStock
          }])
          .select()
          .single();
        if (error) throw error;
        showToast('Product added successfully', 'success');
        if (data) {
          const newProd: Product = {
            id: Number(data.id),
            name: data.name,
            price: Number(data.price),
            lang: data.lang,
            image: data.image,
            series: data.series,
            rating: data.rating,
            reviews: data.reviews,
            description: data.description,
            features: data.features,
            thumbnails: data.thumbnails,
            inStock: data.in_stock
          };
          setDbProducts(prev => [newProd, ...prev]);
        }
      }
      setShowProductModal(false);
      setEditingProduct(null);
    } catch (err: any) {
      console.error('Error saving product:', err);
      showToast(err.message || 'Error saving product', 'error');
    }
  };

  const deleteProduct = async (id: number) => {
    if (!supabase || !hasSupabaseConfig) return;
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', Number(id));
      if (error) throw error;
      showToast('Product deleted successfully', 'success');
      setDbProducts(prev => prev.filter(p => Number(p.id) !== Number(id)));
    } catch (err: any) {
      console.error('Error deleting product:', err);
      showToast(err.message || 'Error deleting product', 'error');
    }
  };

  useEffect(() => {
    if (!supabase || !hasSupabaseConfig) return;

    // Autonomous sign-in for stable userId
    const ensureAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const res = await supabase.auth.signInAnonymously();
          if (res.error) {
            console.warn('Anonymous auth down:', res.error);
            setUserId(null);
          } else {
            setUserId(res.data?.user?.id || null);
          }
        } else {
          setUserId(session.user.id);
        }
      } catch (err) {
        console.warn('Auth check error:', err);
        setUserId(null);
      }
    };
    void ensureAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
        return;
      }
      void (async () => {
        const res = await supabase.auth.signInAnonymously();
        setUserId(res.data?.user?.id || null);
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Persist favorites & cart to localStorage on every change ───
  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.cart, cart);
  }, [cart]);

  // ─── Visitor tracking (deduped by IP + date) ───
  useEffect(() => {
    if (visitorTrackedRef.current) return;
    visitorTrackedRef.current = true;

    const trackVisitor = async () => {
      try {
        const geoRes = await fetch('https://ipapi.co/json/');
        const geo = geoRes.ok ? await geoRes.json() : {};
        const today = new Date().toISOString().split('T')[0];
        const payload = {
          ip: geo.ip || 'unknown',
          visit_date: today,
          country: geo.country_name || 'unknown',
          city: geo.city || 'unknown',
          user_agent: navigator.userAgent,
          referrer: document.referrer || 'direct',
          visited_at: new Date().toISOString(),
        };
        if (supabase && hasSupabaseConfig) {
          // Unique index will prevent duplicates (23505)
          const { error } = await supabase.from('visitors').insert(payload);
          if (error && error.code !== '23505') {
            console.warn('Visitor tracking:', error.message);
          }
        }
        const visits: any[] = JSON.parse(localStorage.getItem('ctcg:v1:visits') || '[]');
        const alreadyToday = visits.some((v: any) => v.ip === payload.ip && (v.visit_date === today || v.date === today));
        if (!alreadyToday) {
          visits.unshift(payload);
          localStorage.setItem('ctcg:v1:visits', JSON.stringify(visits.slice(0, 100)));
        }
      } catch {
        // non-critical
      }
    };
    trackVisitor();
  }, []);

  // Sync Favorites (load from DB on userId available)
  useEffect(() => {
    if (!userId || !supabase) return;
    favoritesLoadedRef.current = false; // reset on userId change

    const fetchFavorites = async () => {
      const { data, error } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', userId);

      if (!error && data) {
        setFavorites(data.map(f => Number(f.product_id)));
      }
      // Mark as loaded AFTER setting state, so sync effect won't overwrite
      favoritesLoadedRef.current = true;
    };
    void fetchFavorites();
  }, [userId]);

  // Sync Cart (load from DB on userId available)
  useEffect(() => {
    if (!userId || !supabase) return;
    cartLoadedRef.current = false; // reset on userId change

    const fetchCart = async () => {
      const { data, error } = await supabase
        .from('cart_items')
        .select('product_id, quantity')
        .eq('user_id', userId);

      if (!error && data) {
        setCart(data.map(item => ({
          productId: Number(item.product_id),
          quantity: Number(item.quantity)
        })));
      }
      cartLoadedRef.current = true;
    };
    void fetchCart();
  }, [userId]);

  // Sync Notifications
  useEffect(() => {
    if (!userId || !supabase) return;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.warn('Notification settings fetch:', error.message);
        return;
      }

      if (data) {
        setNotifications({
          priceDrop: data.price_drop,
          orderStatus: data.order_status,
          newArrivals: data.new_arrivals
        });
      }
    };
    void fetchSettings();
  }, [userId]);

  useEffect(() => {
    if (!userId || !supabase) return;

    const updateSettings = async () => {
      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: userId,
          price_drop: notifications.priceDrop,
          order_status: notifications.orderStatus,
          new_arrivals: notifications.newArrivals,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });
      if (error) {
        console.warn('Notification settings update:', error.message);
      }
    };
    void updateSettings();
  }, [notifications, userId]);

  // --- Real-time persistence for Favorites & Cart ---
  // IMPORTANT: Only sync AFTER initial load from DB to avoid race condition wipe
  useEffect(() => {
    if (!userId || !supabase || !favoritesLoadedRef.current) return;
    const syncFavs = async () => {
      const favRecords = favorites.map(pid => ({ user_id: userId, product_id: pid }));
      await supabase.from('favorites').delete().eq('user_id', userId);
      if (favRecords.length > 0) {
        await supabase.from('favorites').insert(favRecords);
      }
    };
    void syncFavs();
  }, [favorites, userId]);

  useEffect(() => {
    if (!userId || !supabase || !cartLoadedRef.current) return;
    const syncCart = async () => {
      const cartRecords = cart.map(item => ({ user_id: userId, product_id: item.productId, quantity: item.quantity }));
      await supabase.from('cart_items').delete().eq('user_id', userId);
      if (cartRecords.length > 0) {
        await supabase.from('cart_items').insert(cartRecords);
      }
    };
    void syncCart();
  }, [cart, userId]);

  useEffect(() => {
    const pathname = location.pathname;

    if (pathname === '/' || pathname === '') {
      setCurrentView('home');
      return;
    }
    if (pathname === '/favorites') {
      setCurrentView('favorites');
      return;
    }
    if (pathname === '/cart') {
      setCurrentView('cart');
      return;
    }
    if (pathname === '/orders') {
      setCurrentView('orders');
      return;
    }
    if (pathname === '/settings') {
      setCurrentView('settings');
      return;
    }
    if (pathname === '/chat') {
      setCurrentView('chat');
      return;
    }
    if (pathname === '/admin') {
      if (!adminUnlocked) {
        if (suppressAdminPinPromptRef.current) {
          suppressAdminPinPromptRef.current = false;
          navigate('/', { replace: true });
          return;
        }
        setShowAdminPinGate(true);
        navigate('/', { replace: true });
        return;
      }
      setCurrentView('admin');
      void (async () => {
        const ok = await ensureAdminSession();
        if (!ok) {
          setCurrentView('home');
          setShowAdminPinGate(true);
          navigate('/', { replace: true });
        }
      })();
      return;
    }
    if (pathname === '/payment') {
      setCurrentView('payment');
      return;
    }
    if (pathname === '/search') {
      setCurrentView('search');
      return;
    }
    if (pathname.startsWith('/product/')) {
      const idStr = pathname.replace('/product/', '');
      const idNum = Number.parseInt(idStr, 10);
      if (Number.isFinite(idNum)) {
        setSelectedProductId(idNum);
        setCurrentView('product-detail');
        return;
      }
    }

    navigate('/', { replace: true });
  }, [location.pathname, navigate, adminUnlocked]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.favorites, favorites);
  }, [favorites]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.cart, cart);
  }, [cart]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.notifications, notifications);
  }, [notifications]);

  useEffect(() => {
    safeLocalStorageSet(STORAGE_KEYS.orders, orders);
  }, [orders]);



  useEffect(() => {
    if (logoClicks > 0) {
      const timer = setTimeout(() => setLogoClicks(0), 3000);
      return () => clearTimeout(timer);
    }
  }, [logoClicks]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % HERO_PREMIUM_SLIDES.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, []);

  const handleLogoClick = () => {
    const newClicks = logoClicks + 1;
    if (newClicks === 7) {
      setShowAdminPinGate(true);
      setLogoClicks(0);
    } else {
      setLogoClicks(newClicks);
    }
  };

  const submitAdminPin = async (inputPin?: string) => {
    const pinToVerify = inputPin || adminPin;
    if (pinToVerify.trim() === '1966') {
      setAdminUnlocked(true);
      try {
        window.sessionStorage.setItem('ctcg:v1:admin_unlocked', '1');
      } catch {
        // ignore
      }
      setShowAdminPinGate(false);
      setAdminPin('');
      const ok = await ensureAdminSession();
      if (!ok) {
        setAdminUnlocked(false);
        try {
          window.sessionStorage.removeItem('ctcg:v1:admin_unlocked');
        } catch {
          // ignore
        }
        return;
      }
      showToast('PIN accepted', 'success');
      navigate('/admin');
      return;
    }
    showToast('Incorrect PIN', 'error');
    setAdminPin('');
  };

  const onAdminPinDigit = (digit: string) => {
    setAdminPin((prev) => {
      const next = `${prev}${digit}`.slice(0, 4);
      if (next.length === 4) {
        // Schedule navigation so it doesn't run during render
        setTimeout(() => submitAdminPin(next), 0);
      }
      return next;
    });
  };

  const onAdminPinBackspace = () => {
    setAdminPin((prev) => prev.slice(0, -1));
  };

  const onAdminPinClear = () => {
    setAdminPin('');
  };


  const toggleFavorite = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const isRemoving = favorites.includes(id);
    const name = PRODUCTS.find(p => p.id === id)?.name;

    // Optimistic local update always works
    if (isRemoving) {
      setFavorites(prev => prev.filter(fid => fid !== id));
    } else {
      setFavorites(prev => [...prev, id]);
    }
    showToast(isRemoving ? `Removed${name ? ` ${name}` : ''} from favorites` : `Added${name ? ` ${name}` : ''} to favorites`, isRemoving ? 'info' : 'success');

    // Sync to DB if logged in
    if (userId && supabase && hasSupabaseConfig) {
      try {
        if (isRemoving) {
          await supabase.from('favorites').delete().eq('user_id', userId).eq('product_id', id);
        } else {
          await supabase.from('favorites').insert({ user_id: userId, product_id: id });
        }
      } catch (err) {
        console.error('Error syncing favorite:', err);
      }
    }
  };

  const addToCart = async (productId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const productMatch = PRODUCTS.find(p => p.id === productId);
    const name = productMatch?.name;

    try {
      const sourceEl = e?.currentTarget as HTMLElement | undefined;
      const cartEl = document.querySelector('[data-cart-target="true"]') as HTMLElement | null;
      if (sourceEl && cartEl && productMatch?.image) {
        const sourceRect = sourceEl.getBoundingClientRect();
        const cartRect = cartEl.getBoundingClientRect();
        const fxId = Date.now() + Math.floor(Math.random() * 10000);
        setCartFlyFx((prev) => [
          ...prev,
          {
            id: fxId,
            image: productMatch.image,
            startX: sourceRect.left + sourceRect.width / 2,
            startY: sourceRect.top + sourceRect.height / 2,
            endX: cartRect.left + cartRect.width / 2,
            endY: cartRect.top + cartRect.height / 2
          }
        ]);
      }
    } catch {
      // non-blocking animation
    }

    // Optimistic local update — always works
    const existing = cart.find(item => item.productId === productId);
    if (existing) {
      setCart(prev => prev.map(item =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart(prev => [...prev, { productId, quantity: 1 }]);
    }
    showToast(`Added${name ? ` ${name}` : ''} to cart 🛒`, 'success');

    // Sync to DB if logged in
    if (userId && supabase && hasSupabaseConfig) {
      try {
        if (existing) {
          await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('user_id', userId).eq('product_id', productId);
        } else {
          await supabase.from('cart_items').insert({ user_id: userId, product_id: productId, quantity: 1 });
        }
      } catch (err) {
        console.error('Error syncing cart:', err);
      }
    }
  };


  const removeFromCart = async (productId: number) => {
    if (!userId) return;
    const name = PRODUCTS.find(p => p.id === productId)?.name;
    try {
      await supabase.from('cart_items').delete().eq('user_id', userId).eq('product_id', productId);
      showToast(`Removed${name ? ` ${name}` : ''} from cart`, 'info');
      setCart(prev => prev.filter(item => item.productId !== productId));
    } catch (err) {
      console.error('Error removing from cart:', err);
    }
  };

  const updateCartQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        const name = PRODUCTS.find(p => p.id === productId)?.name;
        showToast(`${name ?? 'Item'} quantity: ${newQty}`, 'info');
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const openProductDetail = (id: number) => {
    setSelectedProductId(id);
    navigate(`/product/${id}`);
  };

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" ||
      (activeCategory === "Japanese" && product.lang === "Jpn") ||
      (activeCategory === "Modern" && (product.series === "Sword & Shield" || product.series === "Scarlet & Violet" || product.series === "Sun & Moon")) ||
      (activeCategory === "Vintage" && product.series === "Vintage") ||
      (activeCategory === "Singles" && !product.name.includes("Box") && !product.name.includes("UPC"));
    return matchesSearch && matchesCategory;
  });

  const favoriteProducts = PRODUCTS.filter(p => favorites.includes(p.id)).filter(p => {
    return activeSeries === "All Sets" || p.series === activeSeries;
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 text-text-main dark:text-text-main-dark">
      <div className="flex flex-col min-h-screen w-full max-w-screen-xl mx-auto bg-white dark:bg-slate-900 shadow-2xl relative overflow-hidden">
        {showAdminPinGate && (
          <div className="fixed inset-0 z-[130] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4">
            <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">ADMIN ACCESS</h2>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Enter security pin</p>
                </div>
                <button
                  onClick={() => {
                    setShowAdminPinGate(false);
                    setAdminPin('');
                  }}
                  className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
                  aria-label="Close"
                >
                  <span className="material-symbols-outlined text-slate-600 dark:text-slate-300">close</span>
                </button>
              </div>

              <div className="mt-5 flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 flex items-center justify-center text-lg font-bold text-slate-900 dark:text-white"
                  >
                    {adminPin[i] ? '•' : ''}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    onClick={() => onAdminPinDigit(d)}
                    className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {d}
                  </button>
                ))}
                <button
                  onClick={onAdminPinClear}
                  className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 text-xs"
                >
                  CLEAR
                </button>
                <button
                  onClick={() => onAdminPinDigit('0')}
                  className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  0
                </button>
                <button
                  onClick={onAdminPinBackspace}
                  className="h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center"
                  aria-label="Backspace"
                >
                  <span className="material-symbols-outlined">backspace</span>
                </button>
              </div>
            </div>
          </div>
        )}


        {toasts.length > 0 && (
          <div className="fixed top-4 left-0 right-0 z-[120] px-4 pointer-events-none">
            <div className="max-w-md mx-auto flex flex-col gap-2">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className={`pointer-events-none rounded-xl px-4 py-3 shadow-lg border backdrop-blur-md text-sm font-medium transition-all ${t.type === 'success'
                    ? 'bg-emerald-500/90 text-white border-emerald-400/30'
                    : t.type === 'error'
                      ? 'bg-red-500/90 text-white border-red-400/30'
                      : 'bg-slate-900/90 text-white border-white/10'
                    }`}
                >
                  {t.message}
                </div>
              ))}
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {showSplash ? (
            <SplashScreen key="splash" />
          ) : currentView === 'admin' ? (
            <AdminDashboard
              products={PRODUCTS}
              onBack={() => { void exitAdminMode(); }}
              onChat={() => navigateToView('chat')}
              onAddNew={() => {
                setEditingProduct(null);
                setShowProductModal(true);
              }}
              onEdit={(p) => {
                setEditingProduct(p);
                setShowProductModal(true);
              }}
              onDelete={deleteProduct}
              orders={orders}
            />
          ) : currentView === 'chat' ? (
            <ChatInterface onBack={goBack} userId={userId} />
          ) : currentView === 'settings' ? (
            <SettingsView
              key="settings"
              onBack={() => {
                if (settingsFromAdmin) {
                  navigateToView('admin');
                } else {
                  goBack();
                }
              }}
              onNavigate={(view) => navigateToView(view)}
              theme={theme}
              toggleTheme={toggleTheme}
              isAdminMode={adminUnlocked}
              onExitAdmin={() => {
                void exitAdminMode();
              }}
            />
          ) : currentView === 'cart' ? (
            <CartView
              key="cart"
              cart={cart}
              products={PRODUCTS}
              onBack={goBack}
              onUpdateQuantity={updateCartQuantity}
              onRemove={removeFromCart}
              onNavigate={(view) => navigateToView(view)}
            />
          ) : currentView === 'product-detail' ? (
            <ProductDetailView
              key={`product-detail-${selectedProductId ?? 'none'}`}
              productId={selectedProductId}
              products={PRODUCTS}
              onBack={goBack}
              isFavorite={selectedProductId ? favorites.includes(selectedProductId) : false}
              onToggleFavorite={() => selectedProductId && toggleFavorite(selectedProductId)}
              onAddToCart={() => selectedProductId && addToCart(selectedProductId)}
            />
          ) : currentView === 'orders' ? (
            <OrderHistoryView key="orders" products={PRODUCTS} onBack={goBack} orders={orders} />
          ) : currentView === 'payment' ? (
            <PaymentView
              key="payment"
              products={PRODUCTS}
              onBack={goBack}
              total={cart.reduce((acc, item) => {
                const product = PRODUCTS.find(p => p.id === item.productId);
                return acc + (product?.price || 0) * item.quantity;
              }, 0) + (cart.length > 0 ? 12.50 : 0) + (cart.reduce((acc, item) => {
                const product = PRODUCTS.find(p => p.id === item.productId);
                return acc + (product?.price || 0) * item.quantity;
              }, 0) * 0.08)}
              onPaid={async () => {
                if (!userId) {
                  showToast('Please wait while we connect...', 'info');
                  return;
                }

                const subtotal = cart.reduce((acc, item) => {
                  const product = PRODUCTS.find(p => p.id === item.productId);
                  return acc + (product?.price || 0) * item.quantity;
                }, 0);
                const shipping = cart.length > 0 ? 12.50 : 0;
                const tax = subtotal * 0.08;
                const total = subtotal + shipping + tax;

                try {
                  // 1. Insert Order
                  const { data: orderData, error: orderError } = await supabase
                    .from('orders')
                    .insert({
                      user_id: userId,
                      status: 'Processing',
                      subtotal,
                      shipping,
                      tax,
                      total
                    })
                    .select()
                    .single();

                  if (orderError) throw orderError;

                  // 2. Insert Order Items
                  const orderItems = cart.map(item => ({
                    order_id: orderData.id,
                    product_id: item.productId,
                    quantity: item.quantity,
                    unit_price: PRODUCTS.find(p => p.id === item.productId)?.price || 0
                  }));

                  const { error: itemsError } = await supabase
                    .from('order_items')
                    .insert(orderItems);

                  if (itemsError) throw itemsError;

                  // 3. Clear Cart in DB
                  await supabase.from('cart_items').delete().eq('user_id', userId);

                  showToast('Payment successful! Order placed.', 'success');
                  setCart([]);
                  navigateToView('orders');
                } catch (err) {
                  console.error('Error placing order:', err);
                  showToast('Failed to place order', 'error');
                }
              }}
              onOtherPayment={() => showToast('Other payment methods coming soon.', 'info')}
            />
          ) : currentView === 'home' ? (
            <motion.div
              key="home"
              initial="initial"
              animate="animate"
              exit="exit"
              variants={{
                initial: { opacity: 0 },
                animate: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.2 }
                },
                exit: { opacity: 0 }
              }}
              className="flex flex-col flex-1"
            >
              <motion.header
                variants={{
                  initial: { y: -20, opacity: 0, rotateX: -10 },
                  animate: { y: 0, opacity: 1, rotateX: 0 }
                }}
                className="sticky top-0 z-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    onClick={handleLogoClick}
                    className="w-10 h-10 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  >
                    <img
                      src={LOGO_URL}
                      alt="Chris TCG Logo"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h1 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">CHRIS TCG</h1>
                    <p className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      BOOSTER BOX SHOP
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigateToView('search')}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400"
                  >
                    <span className="material-symbols-outlined">search</span>
                  </button>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300"
                    title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  >
                    <motion.span
                      key={theme}
                      initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="material-symbols-outlined block text-[22px]"
                    >
                      {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                    </motion.span>
                  </button>
                  <button
                    onClick={() => navigateToView('chat')}
                    className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400 relative"
                  >
                    <span className="material-symbols-outlined">notifications</span>
                    {userUnreadChats > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                        {userUnreadChats > 99 ? '99+' : userUnreadChats}
                      </span>
                    )}
                  </button>
                </div>
              </motion.header>

              <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                {/* Premium Hero */}
                <div className="px-4 pt-5 pb-4">
                  <div className="relative overflow-hidden rounded-[28px] border border-slate-200/50 dark:border-slate-700/40 bg-gradient-to-br from-[#0a1022] via-[#11316b] to-[#1d73ff] shadow-2xl shadow-blue-900/30">
                    <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-cyan-300/25 blur-3xl" />
                    <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-indigo-300/15 blur-3xl" />
                    <div className="relative z-10 p-5 md:p-7">
                      <div className="grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-5 md:gap-7 items-stretch">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-50">
                          Collector Series
                        </span>
                        <span className="text-[11px] font-semibold text-blue-100/90">Weekly Restock</span>
                      </div>

                          <h2 className="mt-3 text-[30px] md:text-[38px] font-black leading-[1.02] text-white tracking-tight">
                        The Collector&apos;s Vault
                      </h2>
                          <p className="mt-2 max-w-[340px] text-[12px] md:text-[13px] leading-relaxed text-blue-100/95">
                        Premium booster boxes curated for serious pulls, sealed authenticity, and fast shipping.
                      </p>

                          <div className="mt-4 flex gap-2">
                        <button
                          onClick={() => setActiveCategory('All')}
                          className="rounded-xl bg-white text-slate-900 px-4 py-2 text-xs font-black tracking-wide shadow-lg shadow-black/15 hover:translate-y-[-1px] transition"
                        >
                          Shop Collection
                        </button>
                        <button
                          onClick={() => navigateToView('chat')}
                          className="rounded-xl border border-white/35 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur hover:bg-white/20 transition"
                        >
                          Ask Support
                        </button>
                          </div>

                          <div className="mt-6 hidden md:grid grid-cols-3 gap-2 max-w-[360px]">
                            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                              <p className="text-[10px] text-blue-100/90 uppercase tracking-wide">Live Items</p>
                              <p className="text-base font-black text-white">{PRODUCTS.length}+</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                              <p className="text-[10px] text-blue-100/90 uppercase tracking-wide">Avg Rating</p>
                              <p className="text-base font-black text-white">4.9</p>
                            </div>
                            <div className="rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                              <p className="text-[10px] text-blue-100/90 uppercase tracking-wide">Shipping</p>
                              <p className="text-base font-black text-white">24-48h</p>
                            </div>
                          </div>
                        </div>

                        <div className="min-w-0">
                          <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/5 backdrop-blur-[2px]">
                            <motion.div
                              animate={{ x: `${-heroSlide * 100}%` }}
                              transition={{ duration: 0.65, ease: 'easeInOut' }}
                              className="flex"
                            >
                              {HERO_PREMIUM_SLIDES.map((slide, idx) => (
                                <div key={`premium-slide-${idx}`} className="w-full shrink-0 p-1.5">
                                  <div className="relative h-52 md:h-64 overflow-hidden rounded-[14px]">
                                    <img src={slide.image} alt={slide.title} className="h-full w-full object-cover scale-[1.02]" referrerPolicy="no-referrer" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0" />
                                    <div className="absolute top-3 left-3 inline-flex rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-bold text-white border border-white/20">
                                      {slide.badge}
                                    </div>
                                    <div className="absolute top-3 right-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black text-slate-900">
                                      {slide.price}
                                    </div>
                                    <div className="absolute inset-x-0 bottom-0 p-3">
                                      <p className="text-[15px] md:text-[17px] font-black leading-tight text-white">{slide.title}</p>
                                      <p className="mt-1 text-[11px] md:text-xs text-white/85">{slide.subtitle}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              {HERO_PREMIUM_SLIDES.map((_, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setHeroSlide(idx)}
                                  className={`h-2 rounded-full transition-all ${heroSlide === idx ? 'w-6 bg-white' : 'w-2 bg-white/45'}`}
                                  aria-label={`Go to hero slide ${idx + 1}`}
                                />
                              ))}
                            </div>
                            <div className="w-24 h-1.5 rounded-full bg-white/25 overflow-hidden">
                              <motion.div
                                key={`hero-progress-${heroSlide}`}
                                initial={{ width: 0 }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 5, ease: 'linear' }}
                                className="h-full rounded-full bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="relative w-full overflow-hidden bg-primary/10 dark:bg-primary/20 border-y border-primary/20 py-2 mb-4">
                  <motion.div
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
                    className="flex w-[200%] gap-8 items-center whitespace-nowrap"
                  >
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-8 items-center">
                        <span className="text-xs font-bold text-primary dark:text-primary-light">HOT PULLS: Charizard ex</span>
                        <span className="text-[10px] text-primary/50">|</span>
                        <span className="text-xs font-bold text-primary dark:text-primary-light">RESTOCK: Evolving Skies</span>
                        <span className="text-[10px] text-primary/50">|</span>
                        <span className="text-xs font-bold text-primary dark:text-primary-light">FREE SHIPPING above $150</span>
                        <span className="text-[10px] text-primary/50">|</span>
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* Stats Bar */}
                <motion.div
                  variants={{ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } }}
                  className="flex items-center justify-around px-4 py-3 mx-4 mb-2 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10"
                >
                  {[{ label: 'Products', value: `${PRODUCTS.length}+` }, { label: 'Sold', value: '2.1k' }, { label: 'Rating', value: '4.9★' }].map(s => (
                    <div key={s.label} className="flex flex-col items-center">
                      <span className="text-base font-black text-primary">{s.value}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{s.label}</span>
                    </div>
                  ))}
                </motion.div>

                {/* Categories */}
                <motion.div
                  variants={{
                    initial: { x: 20, opacity: 0 },
                    animate: { x: 0, opacity: 1 }
                  }}
                  className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar scroll-smooth"
                >
                  {["All", "English", "Japanese", "Modern", "Vintage", "Singles"].map((cat) => (
                    <motion.button
                      key={cat}
                      whileTap={{ scale: 0.93 }}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${activeCategory === cat
                        ? 'bg-primary text-white shadow-lg shadow-primary/30 border-primary scale-105'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-slate-700 hover:border-primary/50'
                        }`}
                    >
                      {cat}
                    </motion.button>
                  ))}
                </motion.div>

                {/* Section Header */}
                <div className="flex items-center justify-between px-4 pb-2">
                  <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">All Products</h2>
                  <span className="text-xs text-slate-400 font-medium">{filteredProducts.length} items</span>
                </div>

                {/* Product Grid — 2 cols mobile, 3 cols sm+ */}
                <motion.div
                  variants={{
                    initial: { opacity: 0 },
                    animate: {
                      opacity: 1,
                      transition: { staggerChildren: 0.05 }
                    }
                  }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4 pb-6"
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                      onAddToCart={(e) => { e.stopPropagation(); addToCart(product.id, e); }}
                      onClick={() => openProductDetail(product.id)}
                    />
                  ))}
                </motion.div>
              </main>
            </motion.div>
          ) : currentView === 'favorites' ? (
            <FavoritesPage
              goBack={goBack}
              activeSeries={activeSeries}
              setActiveSeries={setActiveSeries}
              favoriteProducts={favoriteProducts}
              onToggleFavorite={(productId) => toggleFavorite(productId)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-text-muted">View under construction</p>
            </div>
          )}
        </AnimatePresence>

        {!showSplash && (currentView === 'home' || currentView === 'favorites' || currentView === 'search' || currentView === 'settings' || currentView === 'chat' || currentView === 'product-detail' || currentView === 'orders' || currentView === 'cart') ? (
          <nav className="fixed bottom-0 left-0 right-0 w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-4 pb-4 pt-2 z-[60]">
            <div className="grid grid-cols-6 items-center max-w-2xl mx-auto">
              <NavItem icon="home" label="Home" active={currentView === 'home'} onClick={() => navigateToView('home')} />
              <NavItem icon="favorite" label="Favorites" active={currentView === 'favorites'} onClick={() => navigateToView('favorites')} badgeCount={favorites.length} />
              <NavItem icon="shopping_cart" label="Cart" active={currentView === 'cart'} onClick={() => navigateToView('cart')} badgeCount={cart.reduce((acc, item) => acc + item.quantity, 0)} />
              <NavItem icon="receipt_long" label="Orders" active={currentView === 'orders'} onClick={() => navigateToView('orders')} />
              <NavItem icon="chat" label="Chat" active={currentView === 'chat'} onClick={() => navigateToView('chat')} badgeCount={userUnreadChats} />
              <NavItem icon="settings" label="Settings" active={currentView === 'settings'} onClick={() => navigateToView('settings')} />
            </div>
          </nav>
        ) : null}

        <AnimatePresence>
          {cartFlyFx.map((fx) => (
            <motion.img
              key={fx.id}
              src={fx.image}
              alt=""
              className="fixed z-[120] h-12 w-12 rounded-md object-cover pointer-events-none shadow-2xl ring-2 ring-white/70"
              initial={{
                left: fx.startX - 24,
                top: fx.startY - 24,
                scale: 1,
                opacity: 0.95
              }}
              animate={{
                left: fx.endX - 14,
                top: fx.endY - 14,
                scale: 0.28,
                opacity: 0.2
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.65, ease: [0.2, 0.9, 0.2, 1] }}
              onAnimationComplete={() => {
                setCartFlyFx((prev) => prev.filter((x) => x.id !== fx.id));
              }}
            />
          ))}
        </AnimatePresence>

        <ProductFormModal
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSave={saveProduct}
          product={editingProduct}
        />
      </div>
    </div>
  );
}

function OrderHistoryView({ onBack, orders, products }: { onBack: () => void; orders: LocalOrder[]; products: Product[]; key?: string }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Orders');

  const localOrders: DisplayOrder[] = orders.map((o) => {
    const firstItem = o.items[0];
    const product = firstItem ? products.find((p) => p.id === firstItem.productId) : undefined;
    const date = new Date(o.createdAt);
    const dateLabel = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
    return {
      id: o.id,
      date: dateLabel,
      name: product?.name ?? 'Order',
      price: o.total,
      status: o.status,
      image: product?.image ?? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCN8pKHCJ2QqfK5aLW0p7I8X0LJYAlS29erglGedN1pZFXj-aou5iN2RpQI4o7zshjwouw6aTBWwvyjFtEtynkUIIZq91TsVd-IHHEDl5FwGW1Q003PpiCMQOAQn1wyRm6aGM9iEBUq-yxMXmWcDF8Okp8BXeqTN90D_xPWYMfWdxEfBMKS2xqLiNo4jxlxNsn70gsrHcVvOwa3uWASxEkbJxfT4IcTqIxeJgYyyEobh5niHZIo78A1LYStMHVLgKlxUPpcR-WZY6g',
      tracking: undefined,
      message: undefined,
    };
  });

  const filteredOrders: DisplayOrder[] = localOrders.filter((order: DisplayOrder) => {
    const matchesSearch = order.name.toLowerCase().includes(searchQuery.toLowerCase()) || order.id.includes(searchQuery);
    const matchesFilter = activeFilter === 'All Orders' || order.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-screen bg-background-light dark:bg-background-dark font-display"
    >
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">My Orders</h1>
          <button onClick={() => emitToast('Advanced filters coming soon.', 'info')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border-none text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-medium"
              placeholder="Search by set name or order ID..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-3 px-4 pb-3 overflow-x-auto no-scrollbar">
          {['All Orders', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`flex-none px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilter === filter
                ? 'bg-primary text-white shadow-sm shadow-primary/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <main className="flex-1 px-4 py-4 space-y-4 pb-24 overflow-y-auto no-scrollbar">
        {filteredOrders.length === 0 ? (
          <div className="flex h-full min-h-[45vh] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 text-center dark:border-slate-700 dark:bg-slate-900">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600">receipt_long</span>
            <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">No orders yet</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your real orders will appear here after checkout.
            </p>
          </div>
        ) : filteredOrders.map((order: DisplayOrder) => (
          <div
            key={order.id}
            className={`bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border ${order.tracking ? 'border-primary/20 ring-1 ring-primary/10' : 'border-slate-100 dark:border-slate-800'
              }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex gap-3">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0">
                  <img alt={order.name} className="w-full h-full object-cover" src={order.image} referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight mb-1">{order.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Order #{order.id} • {order.date}</p>
                  <p className={`text-sm font-bold mt-1 ${order.tracking ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>${order.price.toFixed(2)}</p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                  order.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                }`}>
                {order.status}
              </span>
            </div>

            {order.tracking && (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{order.tracking.status}</p>
                  <a onClick={(e) => { e.preventDefault(); emitToast('Tracking link opened (simulation).', 'info'); }} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1" href="#">
                    Track Package <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </a>
                </div>
                <div className="relative mt-2">
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full relative" style={{ width: `${order.tracking.progress}%` }}></div>
                  </div>
                  <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-0.5">
                    {order.tracking.steps.map((step, idx) => {
                      const stepProgress = (idx / (order.tracking!.steps.length - 1)) * 100;
                      const isActive = stepProgress <= order.tracking!.progress;
                      const isCurrent = stepProgress === order.tracking!.progress;
                      return (
                        <div
                          key={step}
                          className={`w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-slate-900 ${isActive ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'
                            } ${isCurrent ? 'animate-pulse' : ''}`}
                        ></div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {order.tracking.steps.map((step, idx) => {
                    const stepProgress = (idx / (order.tracking!.steps.length - 1)) * 100;
                    const isFuture = stepProgress > order.tracking!.progress;
                    return (
                      <span key={step} className={isFuture ? 'text-slate-300 dark:text-slate-600' : ''}>{step}</span>
                    );
                  })}
                </div>
              </div>
            )}

            {order.status === 'Delivered' && (
              <div className="mt-4 flex gap-2">
                <button onClick={() => emitToast(`Receipt for order #${order.id} (simulation).`, 'info')} className="flex-1 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                  View Receipt
                </button>
                <button
                  onClick={() => {
                    const match = products.find(p => p.name.toLowerCase() === order.name.toLowerCase())
                      ?? products.find(p => p.name.toLowerCase().includes(order.name.toLowerCase()))
                      ?? products.find(p => order.name.toLowerCase().includes(p.name.toLowerCase()));
                    if (!match) {
                      emitToast('This item is not available in the catalog yet.', 'error');
                      return;
                    }
                    emitAddToCart(match.id);
                  }}
                  className="flex-1 py-2 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                >
                  Buy Again
                </button>
              </div>
            )}

            {order.status === 'Processing' && order.message && (
              <div className="mt-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  {order.message}
                </p>
              </div>
            )}
          </div>
        ))}
      </main>
    </motion.div>
  );
}

function ProductCard({ product, isFavorite, onToggleFavorite, onAddToCart, onClick }: { product: Product, isFavorite: boolean, onToggleFavorite: (e: React.MouseEvent) => void, onAddToCart: (e: React.MouseEvent) => void, onClick: () => void, key?: number | string }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [20, -20]);
  const rotateY = useTransform(x, [-100, 100], [-20, 20]);

  // Shiny glare effects mapped inversely to cursor position
  const glareX = useTransform(x, [-100, 100], [100, 0]);
  const glareY = useTransform(y, [-100, 100], [100, 0]);
  const glareOpacity = useTransform(x, [-100, 100], [0.1, 0.4]);

  function handleMouse(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(event.clientX - centerX);
    y.set(event.clientY - centerY);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.985 }}
      onMouseMove={handleMouse}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onClick={onClick}
      className="group bg-surface-light dark:bg-surface-dark rounded-xl p-3 flex flex-col gap-3 shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-border-light dark:border-border-dark hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-shadow cursor-pointer relative overflow-hidden"
    >
      <div
        style={{ transform: "translateZ(30px)" }}
        className="relative w-full aspect-square rounded-lg bg-background-light dark:bg-background-dark overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800"
      >
        <img
          alt={product.name}
          className="w-full h-full object-cover transition-transform group-hover:scale-[1.12] duration-500 ease-out"
          src={product.image}
          referrerPolicy="no-referrer"
        />

        {/* Holographic Mirror Glare Effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-color-dodge rotate-[35deg] scale-[2.5]"
          style={{
            background: `linear-gradient(135deg, transparent 30%, rgba(255,100,200,0.8) 40%, rgba(100,255,200,0.8) 50%, rgba(200,100,255,0.8) 60%, transparent 70%)`,
            x: glareX,
            y: glareY,
            opacity: glareOpacity
          }}
        />

        {/* Additional White Shine for Pop */}
        <motion.div
          className="absolute inset-0 pointer-events-none mix-blend-overlay rotate-[35deg] scale-[2.5]"
          style={{
            background: `linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.9) 50%, transparent 55%)`,
            x: glareX,
            y: glareY,
            opacity: glareOpacity
          }}
        />

        {/* Automatic mirror shine every 5s */}
        <motion.div
          className="absolute inset-y-0 -left-1/2 w-1/2 pointer-events-none bg-gradient-to-r from-transparent via-white/80 to-transparent skew-x-[-20deg]"
          initial={{ x: '-140%', opacity: 0 }}
          animate={{ x: ['-140%', '180%', '180%'], opacity: [0, 0.85, 0] }}
          transition={{
            duration: 1.1,
            times: [0, 0.55, 1],
            repeat: Infinity,
            repeatDelay: 5,
            delay: (product.id % 5) * 0.25,
            ease: 'easeInOut'
          }}
        />

        <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
          <button
            onClick={onToggleFavorite}
            className={`p-1.5 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-sm transition-colors ${isFavorite ? "text-red-500" : "text-text-muted"
              }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${isFavorite ? 'filled' : ''}`}>
              favorite
            </span>
          </button>
          <button
            onClick={onAddToCart}
            className="p-1.5 rounded-full bg-primary text-white shadow-lg shadow-primary/20 transition-transform active:scale-90 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 translate-x-0 sm:translate-x-4 sm:group-hover:translate-x-0 duration-300"
          >
            <span className="material-symbols-outlined text-[20px]">
              add_shopping_cart
            </span>
          </button>
        </div>
      </div>
      <div style={{ transform: "translateZ(20px)" }} className="z-10 bg-surface-light dark:bg-surface-dark">
        <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5em] text-slate-800 dark:text-slate-100">
          {product.name}
        </h3>
        <div className="flex items-center justify-between mt-1">
          <p className="text-primary font-bold text-base drop-shadow-sm">${product.price}</p>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded shadow-inner tracking-tight">
            {product.lang}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function ProductFormModal({ isOpen, onClose, onSave, product }: { isOpen: boolean, onClose: () => void, onSave: (p: Partial<Product>) => void, product: Product | null }) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    lang: 'Eng',
    image: '',
    series: 'Scarlet & Violet',
    inStock: true,
    description: '',
    features: [],
    thumbnails: [],
    rating: 4.5,
    reviews: 0
  });

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: '',
        price: 0,
        lang: 'Eng',
        image: '',
        series: 'Scarlet & Violet',
        inStock: true,
        description: '',
        features: [],
        thumbnails: [],
        rating: 4.5,
        reviews: 0
      });
    }
  }, [product, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {product ? 'Edit Product' : 'Add New Product'}
            </h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Product Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Silver Tempest Booster Box"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Price ($)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all font-bold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Language</label>
                <select
                  value={formData.lang}
                  onChange={(e) => setFormData({ ...formData, lang: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all font-bold appearance-none"
                >
                  <option value="Eng">English</option>
                  <option value="Jpn">Japanese</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Product Image</label>
              <div className="relative group overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-primary transition-all">
                {formData.image ? (
                  <div className="relative aspect-video">
                    <img src={formData.image} alt="Product" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setFormData({ ...formData, image: '' })}
                        className="p-2 bg-white/20 backdrop-blur-md rounded-full hover:bg-white/40 transition-colors text-white"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center aspect-video cursor-pointer p-6">
                    <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">add_a_photo</span>
                    <span className="text-sm font-bold text-slate-500">Click to upload image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const url = await uploadImage(file);
                          if (url) setFormData({ ...formData, image: url });
                        }
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Series / Set</label>
              <input
                type="text"
                value={formData.series}
                onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                placeholder="e.g. Sword & Shield"
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all font-medium"
              />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white">In Stock Status</p>
                <p className="text-[10px] text-slate-500 font-medium">Toggle availability for customers</p>
              </div>
              <button
                onClick={() => setFormData({ ...formData, inStock: !formData.inStock })}
                className={`w-12 h-6 rounded-full transition-colors relative ${formData.inStock ? 'bg-success' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <motion.div
                  animate={{ x: formData.inStock ? 26 : 2 }}
                  className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Enter product details..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary transition-all text-sm font-medium resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(formData)}
              className="flex-1 px-4 py-3.5 rounded-xl font-bold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
            >
              {product ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function VisitorPanel() {
  const [visitors, setVisitors] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadVisitors = async (withSpinner = false) => {
    if (!supabase) {
      setVisitors([]);
      setLoading(false);
      setRefreshing(false);
      return;
    }
    if (withSpinner) setRefreshing(true);
    const { data, error } = await supabase
      .from('visitors')
      .select('id,ip,country,city,referrer,visited_at,visit_date')
      .order('visited_at', { ascending: false })
      .limit(250);
    if (!error && data) setVisitors(data);
    setLoading(false);
    setRefreshing(false);
  };

  React.useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    void loadVisitors(true);
    const channel = supabase
      .channel('admin_visitors_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitors' }, () => {
        void loadVisitors();
      })
      .subscribe();

    const pollTimer = window.setInterval(() => {
      void loadVisitors();
    }, 5000);

    return () => {
      window.clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const now = Date.now();
  const activeNow = visitors.filter((v) => now - new Date(v.visited_at).getTime() <= 5 * 60 * 1000).length;
  const countByIp = visitors.reduce((acc: Record<string, number>, v) => {
    const ip = String(v.ip ?? 'unknown');
    acc[ip] = (acc[ip] ?? 0) + 1;
    return acc;
  }, {});
  const uniqueVisitors = Object.keys(countByIp).length;
  const returningVisitors = Object.values(countByIp).filter((count) => count > 1).length;
  const topCountries = Object.entries(
    visitors.reduce((acc: Record<string, number>, v) => {
      const country = String(v.country ?? 'unknown');
      acc[country] = (acc[country] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const exportCsv = () => {
    if (visitors.length === 0) return;
    const header = ['visited_at', 'visit_date', 'ip', 'country', 'city', 'referrer'];
    const rows = visitors.map((v) => [v.visited_at ?? '', v.visit_date ?? '', v.ip ?? '', v.country ?? '', v.city ?? '', v.referrer ?? '']);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visitors-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-4 mb-6">
      <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">travel_explore</span>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Visitor Analytics</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadVisitors(true)}
              className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              className="text-[11px] font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              Export CSV
            </button>
          </div>
        </div>

        <div className="px-5 pb-4 grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Tracked</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{visitors.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Active 5m</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{activeNow}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Unique IPs</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{uniqueVisitors}</p>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
            <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Returning</p>
            <p className="text-base font-bold text-slate-900 dark:text-white">{returningVisitors}</p>
          </div>
        </div>

        {topCountries.length > 0 && (
          <div className="px-5 pb-3 flex items-center gap-2 flex-wrap">
            {topCountries.map(([country, count]) => (
              <span key={country} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {country}: {count}
              </span>
            ))}
          </div>
        )}

        {loading ? (
          <p className="text-center text-slate-400 text-sm py-8 pb-5">Loading visitors...</p>
        ) : visitors.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-8 pb-5">No visitors logged yet.</p>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800 max-h-72 overflow-y-auto no-scrollbar">
            {visitors.map((v) => (
              <div key={v.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-primary text-lg">pin_drop</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                      {v.city !== 'unknown' ? v.city : v.ip} • {v.country}
                    </p>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{timeAgo(v.visited_at)}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {v.referrer !== 'direct' ? `via ${v.referrer}` : 'Direct visit'} • {v.ip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard({ products, onAddNew, onEdit, onDelete, onBack, onChat, orders }: { products: Product[], onAddNew: () => void, onEdit: (p: Product) => void, onDelete: (id: number) => void, onBack: () => void, onChat: () => void, orders: any[] }) {
  const [unreadChats, setUnreadChats] = useState(0);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inbox' | 'inventory' | 'settings'>('dashboard');
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [inventoryQuery, setInventoryQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in' | 'out'>('all');
  const [adminPreferences, setAdminPreferences] = useState({
    liveAlerts: true,
    smartRestockHints: true,
    guardedMode: true,
    compactCards: false
  });

  useEffect(() => {
    if (!supabase) return;
    let pollTimer: number | null = null;

    const checkUnread = async () => {
      const { data: threadsData } = await supabase.from('chat_threads').select('id,user_id,last_admin_read_at');
      const { data: messagesData } = await supabase
        .from('chat_messages')
        .select('thread_id,sender,created_at')
        .eq('sender', 'user');

      if (!threadsData || !messagesData) {
        setUnreadChats(0);
        return;
      }

      const threadToVisitor = new Map<string, string>();
      const threadToReadAt = new Map<string, number>();
      threadsData.forEach((t) => {
        threadToVisitor.set(String(t.id), String(t.user_id ?? t.id));
        threadToReadAt.set(String(t.id), t.last_admin_read_at ? new Date(t.last_admin_read_at).getTime() : 0);
      });

      const perVisitorUnread = new Map<string, number>();
      messagesData.forEach((m) => {
        if (m.sender !== 'user') return;
        const threadId = String(m.thread_id);
        const visitorId = threadToVisitor.get(String(m.thread_id));
        if (!visitorId) return;
        const readAt = threadToReadAt.get(threadId) ?? 0;
        const msgAt = new Date(m.created_at).getTime();
        if (msgAt > readAt) {
          perVisitorUnread.set(visitorId, (perVisitorUnread.get(visitorId) ?? 0) + 1);
        }
      });

      let totalUnread = 0;
      perVisitorUnread.forEach((n) => {
        totalUnread += n;
      });
      setUnreadChats(totalUnread);
    };

    void checkUnread();

    const channel = supabase
      .channel('admin_unread_badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        void checkUnread();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_threads' }, () => {
        void checkUnread();
      })
      .subscribe();

    pollTimer = window.setInterval(() => {
      void checkUnread();
    }, 700);

    return () => {
      if (pollTimer) window.clearInterval(pollTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    const fetchAdminOrders = async () => {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          user_id,
          created_at,
          status,
          total,
          customer_name,
          customer_email,
          customer_phone,
          shipping_address,
          order_items (
            quantity,
            unit_price,
            product_id,
            products (name, image)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading admin orders:', error);
      } else {
        setAdminOrders(data ?? []);
      }
      setOrdersLoading(false);
    };

    void fetchAdminOrders();

    const channel = supabase
      .channel('admin_orders_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        void fetchAdminOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateOrderStatus = async (orderId: string, status: 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled') => {
    if (!supabase) return;
    setSavingOrderId(orderId);

    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order status:', error);
      emitToast('Failed to update order status', 'error');
    } else {
      setAdminOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      emitToast(`Order ${orderId.slice(0, 8)} marked as ${status}`, 'success');
    }

    setSavingOrderId(null);
  };

  const normalizedInventoryQuery = inventoryQuery.trim().toLowerCase();
  const filteredProducts = products.filter((product) => {
    if (stockFilter === 'in' && !product.inStock) return false;
    if (stockFilter === 'out' && product.inStock) return false;
    if (!normalizedInventoryQuery) return true;
    return (
      product.name.toLowerCase().includes(normalizedInventoryQuery) ||
      product.series.toLowerCase().includes(normalizedInventoryQuery) ||
      product.lang.toLowerCase().includes(normalizedInventoryQuery)
    );
  });

  const inStockCount = products.filter((p) => p.inStock).length;
  const outOfStockCount = products.length - inStockCount;
  const totalRevenue = adminOrders.reduce((sum, order) => sum + Number(order.total ?? 0), 0);
  const toggleAdminPreference = (key: keyof typeof adminPreferences) => {
    setAdminPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="flex-1 flex flex-col pb-20 relative overflow-x-hidden bg-background-light dark:bg-background-dark"
    >
      <header className="sticky top-0 z-20 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onBack}>
          <div className="bg-primary/10 text-primary p-2 rounded-lg">
            <span className="material-symbols-outlined text-2xl">grid_view</span>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Chris TCG</h1>
            <p className="text-xs text-text-sub font-medium">Admin Dashboard</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-1.5 text-danger hover:bg-danger/10 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-xl">logout</span>
            <span className="text-xs font-bold">Exit</span>
          </button>
          <button
            onClick={() => setActiveTab('inbox')}
            className="relative p-2 text-text-sub hover:text-primary transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadChats > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface-light dark:ring-surface-dark">
                {unreadChats > 99 ? '99+' : unreadChats}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'text-primary bg-primary/10' : 'text-text-sub hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            aria-label="Admin settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      {activeTab === 'inbox' && (
        <AdminChatInbox onBack={() => setActiveTab('dashboard')} onUnreadChange={setUnreadChats} />
      )}

      {activeTab === 'dashboard' && (
        <>
          <div className="px-4 pt-6 pb-2">
            <section className="relative overflow-hidden rounded-3xl border border-cyan-200/70 dark:border-cyan-500/30 bg-gradient-to-br from-cyan-100 via-sky-50 to-emerald-100 dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/60 p-5 shadow-[0_22px_40px_-26px_rgba(14,116,144,0.6)]">
              <div className="absolute -top-10 -right-8 w-36 h-36 rounded-full bg-cyan-300/40 blur-3xl dark:bg-cyan-500/30"></div>
              <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-emerald-300/40 blur-2xl dark:bg-emerald-500/20"></div>
              <div className="relative">
                <p className="inline-flex items-center gap-1 rounded-full border border-cyan-500/25 bg-white/70 dark:bg-slate-900/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
                  <span className="material-symbols-outlined text-[14px]">bolt</span>
                  Control Center
                </p>
                <h2 className="mt-3 text-2xl font-black leading-tight text-slate-900 dark:text-white">Admin Mission Board</h2>
                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">Track revenue, inventory pressure, and support load in one view.</p>
              </div>
              <div className="relative mt-5 grid grid-cols-3 gap-3">
                <div className="rounded-2xl border border-white/70 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/70 px-3 py-2 backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Revenue</p>
                  <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">${totalRevenue.toFixed(0)}</p>
                </div>
                <div className="rounded-2xl border border-white/70 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/70 px-3 py-2 backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Orders</p>
                  <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{adminOrders.length || orders.length}</p>
                </div>
                <div className="rounded-2xl border border-white/70 dark:border-slate-700/60 bg-white/75 dark:bg-slate-900/70 px-3 py-2 backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Unread</p>
                  <p className="mt-1 text-lg font-black text-slate-900 dark:text-white">{unreadChats}</p>
                </div>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-2 gap-3 px-4 pb-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                  <span className="material-symbols-outlined text-[20px]">attach_money</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600">Live</span>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-text-sub">Total Revenue</p>
              <p className="mt-1 text-2xl font-black text-text-main dark:text-white">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-300">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-sky-600">Stock</span>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-text-sub">Items Listed</p>
              <p className="mt-1 text-2xl font-black text-text-main dark:text-white">{products.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                  <span className="material-symbols-outlined text-[20px]">package_2</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">Queue</span>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-text-sub">Active Orders</p>
              <p className="mt-1 text-2xl font-black text-text-main dark:text-white">{adminOrders.length || orders.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-300">
                  <span className="material-symbols-outlined text-[20px]">chat_bubble</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wide text-rose-600">Support</span>
              </div>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-text-sub">Unread Chats</p>
              <p className="mt-1 text-2xl font-black text-text-main dark:text-white">{unreadChats}</p>
            </div>
          </div>

          <div className="px-4 pb-4">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm">
              <h3 className="font-black text-base text-slate-900 dark:text-white mb-3">Rapid Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                <button onClick={onAddNew} className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3 py-2.5 text-sm font-semibold hover:brightness-110 transition-all">Add Product</button>
                <button onClick={() => setActiveTab('inventory')} className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Inventory Lab</button>
                <button onClick={() => setActiveTab('inbox')} className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Support Inbox</button>
                <button onClick={onChat} className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2.5 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Open User Chat</button>
              </div>
            </div>
          </div>

          <VisitorPanel />

          <div className="px-4 pb-4 mb-20">
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">receipt_long</span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">Manage Orders</h3>
                </div>
                <span className="text-xs font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-full">{adminOrders.length}</span>
              </div>

              {ordersLoading ? (
                <p className="px-5 pb-5 text-sm text-slate-500">Loading orders...</p>
              ) : adminOrders.length === 0 ? (
                <p className="px-5 pb-5 text-sm text-slate-500">No orders found yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto no-scrollbar">
                  {adminOrders.map((order) => {
                    const firstItem = order.order_items?.[0];
                    const firstProduct = firstItem?.products;
                    const orderLabel = firstProduct?.name ?? `${order.order_items?.length ?? 0} item(s)`;
                    const created = new Date(order.created_at).toLocaleString();
                    return (
                      <div key={order.id} className="px-5 py-3">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 bg-cover bg-center shrink-0" style={{ backgroundImage: `url("${firstProduct?.image || LOGO_URL}")` }}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{orderLabel}</p>
                                <p className="text-[11px] text-slate-500">#{order.id.slice(0, 8)} - {created}</p>
                                <p className="text-[11px] text-slate-500">Customer: {order.customer_name || 'Guest'} - {order.customer_email || 'No email'}</p>
                              </div>
                              <p className="text-sm font-bold text-primary">${Number(order.total ?? 0).toFixed(2)}</p>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <select
                                value={order.status}
                                disabled={savingOrderId === order.id}
                                onChange={(e) => void updateOrderStatus(order.id, e.target.value as 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled')}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                              >
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                              {savingOrderId === order.id && <span className="text-[11px] text-slate-400">Saving...</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'inventory' && (
        <div className="px-4 py-4 mb-20">
          <div className="bg-surface-light dark:bg-surface-dark rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-bold text-xl text-text-main dark:text-white">Inventory Center</h3>
                <p className="text-xs text-text-sub mt-1">{products.length} products - {inStockCount} in stock - {outOfStockCount} out of stock</p>
              </div>
              <button onClick={onAddNew} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-lg shadow-primary/30 transition-all active:scale-95">
                <span className="material-symbols-outlined text-sm">add</span>
                Add New
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-2 mb-4">
              <input
                value={inventoryQuery}
                onChange={(e) => setInventoryQuery(e.target.value)}
                placeholder="Search by product, series or language"
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-slate-800 dark:text-slate-200"
              />
              <div className="flex items-center gap-2">
                <button onClick={() => setStockFilter('all')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${stockFilter === 'all' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>All</button>
                <button onClick={() => setStockFilter('in')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${stockFilter === 'in' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>In Stock</button>
                <button onClick={() => setStockFilter('out')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${stockFilter === 'out' ? 'bg-primary text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>Out</button>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <p className="text-sm text-slate-500 py-10 text-center">No products match your current filters.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="group bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex gap-3 items-center hover:border-primary/50 dark:hover:border-primary/50 transition-colors">
                    <div className="w-16 h-20 bg-slate-100 dark:bg-slate-700 rounded-lg flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: `url("${product.image}")` }}></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-sm text-text-main dark:text-white truncate pr-2">{product.name}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${product.inStock ? 'text-success bg-success/10' : 'text-danger bg-danger/10'}`}>{product.inStock ? 'In Stock' : 'Sold Out'}</span>
                      </div>
                      <p className="text-xs text-text-sub mt-1">{product.series} - {product.lang === 'Jpn' ? 'Japanese' : 'English'}</p>
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-primary font-bold">${product.price}</p>
                        <div className="flex gap-1">
                          <button onClick={() => onEdit(product)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => onDelete(product.id)} className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="px-4 py-5 mb-20">
          <section className="relative overflow-hidden rounded-3xl border border-amber-300/70 dark:border-amber-500/30 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 dark:from-slate-900 dark:via-slate-950 dark:to-rose-950/40 p-5 shadow-[0_24px_44px_-30px_rgba(217,119,6,0.7)]">
            <div className="absolute -right-10 -top-10 w-36 h-36 rounded-full bg-amber-300/45 blur-3xl dark:bg-amber-500/30"></div>
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-rose-300/40 blur-2xl dark:bg-rose-500/20"></div>
            <div className="relative">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/75 dark:bg-slate-900/70 border border-amber-500/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-200">
                <span className="material-symbols-outlined text-[14px]">settings</span>
                Admin Settings Hub
              </p>
              <h3 className="mt-3 text-2xl font-black text-slate-900 dark:text-white">Control What Matters Fast</h3>
              <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">Tune the admin workspace to respond quicker to chats, stock changes, and order updates.</p>
            </div>
          </section>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <button onClick={() => toggleAdminPreference('liveAlerts')} className="w-full text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Live Alerts</p>
                  <p className="text-xs text-text-sub mt-1">Bubble up new customer messages instantly.</p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${adminPreferences.liveAlerts ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                  {adminPreferences.liveAlerts ? 'ON' : 'OFF'}
                </span>
              </div>
            </button>

            <button onClick={() => toggleAdminPreference('smartRestockHints')} className="w-full text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Smart Restock Hints</p>
                  <p className="text-xs text-text-sub mt-1">Highlight inventory gaps from live order flow.</p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${adminPreferences.smartRestockHints ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                  {adminPreferences.smartRestockHints ? 'ON' : 'OFF'}
                </span>
              </div>
            </button>

            <button onClick={() => toggleAdminPreference('guardedMode')} className="w-full text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Guarded Mode</p>
                  <p className="text-xs text-text-sub mt-1">Require extra confirmation before risky actions.</p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${adminPreferences.guardedMode ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                  {adminPreferences.guardedMode ? 'ON' : 'OFF'}
                </span>
              </div>
            </button>

            <button onClick={() => toggleAdminPreference('compactCards')} className="w-full text-left rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white">Compact Cards</p>
                  <p className="text-xs text-text-sub mt-1">Use tighter cards when managing large catalogs.</p>
                </div>
                <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${adminPreferences.compactCards ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                  {adminPreferences.compactCards ? 'ON' : 'OFF'}
                </span>
              </div>
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark p-4 shadow-sm">
            <h4 className="text-sm font-black text-slate-900 dark:text-white">Admin Quick Kit</h4>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2.5">
              <button onClick={() => setActiveTab('dashboard')} className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2.5 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Mission Board</button>
              <button onClick={() => setActiveTab('inbox')} className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2.5 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Open Inbox</button>
              <button onClick={() => setActiveTab('inventory')} className="rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 px-3 py-2.5 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Inventory Lab</button>
              <button onClick={onAddNew} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white px-3 py-2.5 text-xs font-bold hover:brightness-110 transition-all">Add Product</button>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Live snapshot: {products.length} products, {adminOrders.length || orders.length} active orders, {unreadChats} unread chats.</p>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 w-full bg-surface-light dark:bg-surface-dark border-t border-slate-200 dark:border-slate-800 px-2 pb-5 pt-3 flex justify-around items-end z-[60] shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 ${activeTab === 'dashboard' ? 'text-primary' : 'text-text-sub'}`}>
          <span className={`material-symbols-outlined text-[26px] ${activeTab === 'dashboard' ? 'filled' : ''}`}>dashboard</span>
          <span className="text-[10px] font-semibold">Dashboard</span>
        </button>

        <button onClick={() => setActiveTab('inbox')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 group relative ${activeTab === 'inbox' ? 'text-primary' : 'text-text-sub hover:text-primary'}`}>
          <div className="relative">
            <span className={`material-symbols-outlined text-[26px] ${activeTab === 'inbox' ? 'filled' : 'group-hover:-translate-y-0.5 transition-transform'}`}>chat_bubble</span>
            {unreadChats > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-surface-light dark:ring-surface-dark shadow-sm">
                {unreadChats > 99 ? '99+' : unreadChats}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Inbox</span>
        </button>

        <div className="relative -top-6">
          <button onClick={onAddNew} className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-105 active:scale-95 transition-transform border-4 border-background-light dark:border-background-dark">
            <span className="material-symbols-outlined text-3xl">add_box</span>
          </button>
        </div>

        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 group ${activeTab === 'inventory' ? 'text-primary' : 'text-text-sub hover:text-primary'}`}>
          <span className={`material-symbols-outlined text-[26px] ${activeTab === 'inventory' ? 'filled' : 'group-hover:-translate-y-0.5 transition-transform'}`}>inventory_2</span>
          <span className="text-[10px] font-medium">Inventory</span>
        </button>

        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 group ${activeTab === 'settings' ? 'text-primary' : 'text-text-sub hover:text-primary'}`}>
          <span className={`material-symbols-outlined text-[26px] ${activeTab === 'settings' ? 'filled' : 'group-hover:-translate-y-0.5 transition-transform'}`}>settings</span>
          <span className="text-[10px] font-medium">Admin</span>
        </button>

      </nav>
    </motion.div>
  );
}

function AdminChatInbox({ onBack, onUnreadChange }: { onBack: () => void, onUnreadChange?: (count: number) => void }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<{ threadId: string; visitorId: string; displayName: string } | null>(null);

  useEffect(() => {
    if (!supabase) return;

    const fetchThreads = async () => {
      const { data: threadsData } = await supabase.from('chat_threads').select('*');
      const { data: messagesData } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: false });
      if (!threadsData || !messagesData) return;

      const visitorToThreads = new Map<string, any[]>();
      threadsData.forEach((t) => {
        const visitorId = String(t.user_id ?? t.id);
        const arr = visitorToThreads.get(visitorId) ?? [];
        arr.push(t);
        visitorToThreads.set(visitorId, arr);
      });

      const enriched = Array.from(visitorToThreads.entries()).map(([visitorId, visitorThreads]) => {
        const threadIds = new Set(visitorThreads.map((t) => t.id));
        const visitorMsgs = messagesData.filter((m) => threadIds.has(m.thread_id));
        const latestMessage = visitorMsgs[0];
        const threadReadAt = new Map<string, number>();
        visitorThreads.forEach((t) => {
          threadReadAt.set(String(t.id), t.last_admin_read_at ? new Date(t.last_admin_read_at).getTime() : 0);
        });
        const unreadCount = visitorMsgs.filter((m) => {
          if (m.sender !== 'user') return false;
          const readAt = threadReadAt.get(String(m.thread_id)) ?? 0;
          return new Date(m.created_at).getTime() > readAt;
        }).length;
        const latestThread = visitorThreads.find((t) => t.id === latestMessage?.thread_id) ?? visitorThreads[0];
        const persistedName = typeof latestThread?.subject === 'string' ? latestThread.subject.trim() : '';

        return {
          ...latestThread,
          visitorId,
          displayName: persistedName || 'Site Visitor',
          latestMessage,
          unreadCount,
          isUnread: unreadCount > 0
        };
      }).filter((x) => x.latestMessage)
        .sort((a, b) => new Date(b.latestMessage.created_at).getTime() - new Date(a.latestMessage.created_at).getTime());
      setThreads(enriched);
      onUnreadChange?.(enriched.reduce((acc, t) => acc + (t.unreadCount ?? 0), 0));
    };

    void fetchThreads();

    const channel = supabase.channel('admin_inbox')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        void fetchThreads();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_threads' }, () => {
        void fetchThreads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedThread]);

  if (selectedThread) {
    return (
      <ChatInterface
        onBack={() => setSelectedThread(null)}
        userId={null}
        adminThreadId={selectedThread.threadId}
        adminMode={true}
        adminVisitorName={selectedThread.displayName}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col pt-4 pb-20">
      <div className="px-5 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-2xl">mail</span>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Inbox</h2>
        </div>
        <span className="text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full">
          {threads.reduce((acc, t) => acc + (t.unreadCount ?? 0), 0)} Unread
        </span>
      </div>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center mt-12">
            <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 mb-3">chat_bubble_outline</span>
            <p className="text-slate-500 font-medium">No active conversations</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
            {threads.map((t) => (
              <div
                key={t.id}
                onClick={async () => {
                  // Mark all threads for this visitor as read instantly when admin opens the conversation.
                  await supabase
                    .from('chat_threads')
                    .update({ last_admin_read_at: new Date().toISOString() })
                    .eq('user_id', t.visitorId);

                  setThreads((prev) => {
                    const next = prev.map((x) =>
                      x.visitorId === t.visitorId ? { ...x, unreadCount: 0, isUnread: false } : x
                    );
                    onUnreadChange?.(next.reduce((acc, x) => acc + (x.unreadCount ?? 0), 0));
                    return next;
                  });
                  setSelectedThread({ threadId: t.id, visitorId: t.visitorId, displayName: t.displayName });
                }}
                className="flex items-start gap-3 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center font-bold text-lg shrink-0 mt-0.5">
                  {(t.displayName?.trim()?.[0] || 'S').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1 gap-2">
                    <h3 className={`truncate text-sm ${t.isUnread ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-300'}`}>
                      {t.displayName}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0 ml-2">
                      {t.latestMessage ? new Date(t.latestMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className={`text-[13px] truncate ${t.isUnread ? 'font-medium text-slate-800 dark:text-slate-200' : 'text-slate-500'}`}>
                    {t.latestMessage ? t.latestMessage.body : 'No messages yet'}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const nextName = window.prompt('Rename visitor', t.displayName || '');
                      if (nextName === null) return;
                      const cleaned = nextName.trim();
                      await supabase
                        .from('chat_threads')
                        .update({ subject: cleaned || null })
                        .eq('user_id', t.visitorId);
                      setThreads((prev) => prev.map((x) => x.visitorId === t.visitorId ? { ...x, displayName: cleaned || 'Site Visitor' } : x));
                    }}
                    className="text-slate-400 hover:text-primary"
                    title="Rename visitor"
                  >
                    <span className="material-symbols-outlined text-[17px]">edit</span>
                  </button>
                  {t.unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {t.unreadCount > 99 ? '99+' : t.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ChatInterface({ onBack, userId, adminThreadId, adminMode, adminVisitorName }: { onBack: () => void, userId: string | null, adminThreadId?: string, adminMode?: boolean, adminVisitorName?: string, key?: string }) {
  const [threadId, setThreadId] = useState<string | null>(adminThreadId || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const userThreadIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ((!userId && !adminThreadId) || !supabase) return;
    let channel: any = null;
    let pollTimer: number | null = null;

    const initChat = async () => {
      let currentThreadId = adminThreadId || threadId;
      let threadIdsToLoad: string[] = [];

      if (!adminMode && userId) {
        // Load all threads for this visitor so full history is visible.
        const { data: existingThreads } = await supabase
          .from('chat_threads')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: true });

        if (existingThreads && existingThreads.length > 0) {
          threadIdsToLoad = existingThreads.map((t: any) => String(t.id));
          currentThreadId = threadIdsToLoad[0];
        } else {
          // No thread yet — create one and start history from it.
          const { data: newThread, error: createError } = await supabase
            .from('chat_threads')
            .insert({ user_id: userId, subject: null })
            .select()
            .single();

          if (!createError && newThread) {
            currentThreadId = String(newThread.id);
            threadIdsToLoad = [String(newThread.id)];
          }
        }
      } else if (currentThreadId) {
        threadIdsToLoad = [String(currentThreadId)];
      }

      if (currentThreadId && threadIdsToLoad.length > 0) {
        setThreadId(currentThreadId);
        if (!adminMode) {
          userThreadIdsRef.current = new Set(threadIdsToLoad);
        }

        const fetchLatestMessages = async () => {
          const messagesQuery = supabase
            .from('chat_messages')
            .select('*')
            .order('created_at', { ascending: true });
          const { data: msgs, error: msgsError } = adminMode
            ? await messagesQuery.eq('thread_id', currentThreadId)
            : await messagesQuery.in('thread_id', threadIdsToLoad);

          if (!msgsError && msgs) {
            setMessages(msgs.map(m => ({
              id: m.id.toString(),
              text: m.body,
              sender: m.sender,
              timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'seen'
            })));
          }
        };

        await fetchLatestMessages();

        // Mark this thread as read for the current side as soon as chat is opened.
        if (adminMode) {
          await supabase
            .from('chat_threads')
            .update({ last_admin_read_at: new Date().toISOString() })
            .eq('id', currentThreadId);
        } else if (userId) {
          await supabase
            .from('chat_threads')
            .update({ last_user_read_at: new Date().toISOString() })
            .eq('user_id', userId);
        }

        // Real-time listener
        if (adminMode) {
          channel = supabase
            .channel(`chat:${currentThreadId}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages',
              filter: `thread_id=eq.${currentThreadId}`
            }, (payload) => {
              const msg = payload.new as any;
              setMessages(prev => {
                if (prev.find(m => m.id === msg.id.toString())) return prev;
                return [...prev, {
                  id: msg.id.toString(),
                  text: msg.body,
                  sender: msg.sender,
                  timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'seen'
                }];
              });
              void fetchLatestMessages();

              if (msg.sender === 'user') {
                void supabase
                  .from('chat_threads')
                  .update({ last_admin_read_at: new Date().toISOString() })
                  .eq('id', currentThreadId);
              }
            })
            .subscribe();
        } else {
          channel = supabase
            .channel(`chat:user:${userId}`)
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_messages'
            }, (payload) => {
              const msg = payload.new as any;
              if (!userThreadIdsRef.current.has(String(msg.thread_id))) return;

              setMessages(prev => {
                if (prev.find(m => m.id === msg.id.toString())) return prev;
                return [...prev, {
                  id: msg.id.toString(),
                  text: msg.body,
                  sender: msg.sender,
                  timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'seen'
                }];
              });
              void fetchLatestMessages();

              if (msg.sender === 'admin') {
                void supabase
                  .from('chat_threads')
                  .update({ last_user_read_at: new Date().toISOString() })
                  .eq('id', msg.thread_id);
              }
            })
            .on('postgres_changes', {
              event: 'INSERT',
              schema: 'public',
              table: 'chat_threads',
              filter: `user_id=eq.${userId}`
            }, (payload) => {
              const t = payload.new as any;
              if (t?.id) userThreadIdsRef.current.add(String(t.id));
            })
            .subscribe();
        }

        // Fallback sync: guarantees near-instant updates even if realtime channel lags.
        pollTimer = window.setInterval(() => {
          void fetchLatestMessages();
        }, 600);
      }
    };

    void initChat();
    return () => {
      if (pollTimer) {
        window.clearInterval(pollTimer);
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId, adminThreadId, adminMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = newMessage.trim();
    // Allow admin (no userId) and regular users to send
    if (!trimmed || !supabase || isSending) return;

    if (!threadId) {
      emitToast('Connecting to support...', 'info');
      return;
    }

    setIsSending(true);
    setNewMessage('');

    // Optimistic UI Update
    const tempId = 'temp-' + Date.now();
    setMessages(prev => [...prev, {
      id: tempId,
      text: trimmed,
      sender: adminMode ? 'admin' : 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'seen'
    }]);

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          thread_id: threadId,
          body: trimmed,
          sender: adminMode ? 'admin' : 'user'
        })
        .select()
        .single();

      if (error) throw error;

      // Replace temp ID with real DB ID
      setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id.toString() } : m));

      // Keep read marker fresh while this conversation is open.
      if (adminMode) {
        await supabase
          .from('chat_threads')
          .update({ last_admin_read_at: new Date().toISOString() })
          .eq('id', threadId);
      } else {
        await supabase
          .from('chat_threads')
          .update({ last_user_read_at: new Date().toISOString() })
          .eq('id', threadId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== tempId));
      emitToast('Failed to send message', 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-[100dvh] bg-white dark:bg-[#1a2230] relative overflow-hidden z-[100]"
    >
      {/* Premium Header */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/60 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl px-4 py-3.5 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all active:scale-95 border border-slate-100 dark:border-slate-700/50">
            <span className="material-symbols-outlined text-[20px]">arrow_back_ios_new</span>
          </button>

          <div className="flex items-center gap-3 ml-1">
            <div className="relative">
              {!adminMode ? (
                <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white dark:border-slate-800 bg-slate-200 bg-cover bg-center shadow-md ring-2 ring-primary/20" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCe1VDGLNu29L2tjtO9X_9j6BaW7qkGUPgRyymCOyXsreYhe24X09VXkwDR9o_utvJ-3ww1nDQfnANwLWDZRVJh1gVsb78V6oD-OOhsO1rjyBmg9KsRsHe99iUfJfmTNoTZZNXUrQus75IyHst12S7eT1Msj9OX49lvlya11I2PutDrxd4cH4SEpesbOfLR8qmRRzSyY4bFt9n0sq1H-LzGDz7U5YijkKAN8ncOxBkpM3h_pjCkHhE5h6wsnu95CQH0REcdeFZ_S5k')" }}></div>
              ) : (
                <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-white dark:border-slate-800 bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-md ring-2 ring-primary/20">S</div>
              )}
              <span className="absolute bottom-0 right-0 block h-3.5 w-3.5 rounded-full bg-success border-2 border-white dark:border-slate-900"></span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <h2 className="text-[15px] font-bold leading-tight text-slate-900 dark:text-white mt-0.5">{adminMode ? (adminVisitorName || 'Site Visitor') : 'Chris Support'}</h2>
                {!adminMode && <span className="material-symbols-outlined text-primary text-[14px] filled">verified</span>}
              </div>
              <p className="text-[11px] font-medium text-success dark:text-success/80 mt-0.5">Online now</p>
            </div>
          </div>
        </div>

        <div className="rounded-full bg-emerald-100 dark:bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
          Live
        </div>
      </div>

      {/* Chat Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900/50 p-4 scroll-smooth no-scrollbar relative">
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

        <div className="flex flex-col gap-4 relative z-10">
          <div className="flex justify-center py-2">
            <span className="rounded-full bg-white dark:bg-slate-800 px-4 py-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 shadow-sm border border-slate-100 dark:border-slate-700 uppercase tracking-widest">Support Session</span>
          </div>

          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const isCurrentUser = adminMode ? msg.sender === 'admin' : msg.sender === 'user';
              const isConsecutive = idx > 0 && messages[idx - 1].sender === msg.sender;

              return (
                <motion.div
                  key={msg.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={`flex items-end gap-2.5 ${isCurrentUser ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-2'}`}
                >
                  {!isCurrentUser && (
                    <div
                      className={`h-7 w-7 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 flex items-center justify-center font-bold text-[11px] overflow-hidden bg-cover bg-center border border-white dark:border-slate-800 shadow-sm ${isConsecutive ? 'opacity-0' : 'opacity-100'}`}
                      style={!adminMode ? { backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCe1VDGLNu29L2tjtO9X_9j6BaW7qkGUPgRyymCOyXsreYhe24X09VXkwDR9o_utvJ-3ww1nDQfnANwLWDZRVJh1gVsb78V6oD-OOhsO1rjyBmg9KsRsHe99iUfJfmTNoTZZNXUrQus75IyHst12S7eT1Msj9OX49lvlya11I2PutDrxd4cH4SEpesbOfLR8qmRRzSyY4bFt9n0sq1H-LzGDz7U5YijkKAN8ncOxBkpM3h_pjCkHhE5h6wsnu95CQH0REcdeFZ_S5k')" } : undefined}
                    >
                      {adminMode && 'S'}
                    </div>
                  )}
                  <div className={`flex max-w-[78%] flex-col gap-1 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2.5 text-[15px] transition-all shadow-sm ${msg.sender === 'user'
                      ? `bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/20 rounded-2xl ${isConsecutive ? (adminMode ? 'rounded-tl-md' : 'rounded-tr-md') : ''} ${adminMode ? 'rounded-bl-md' : 'rounded-br-md'}`
                      : msg.sender === 'admin'
                        ? `bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/20 rounded-2xl ${isConsecutive ? (adminMode ? 'rounded-tr-md' : 'rounded-tl-md') : ''} ${adminMode ? 'rounded-br-md' : 'rounded-bl-md'}`
                        : `bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/50 rounded-2xl rounded-bl-md`
                      }`}>
                      {msg.text.startsWith('http') && (msg.text.includes('.png') || msg.text.includes('.jpg') || msg.text.includes('.jpeg') || msg.text.includes('.webp') || msg.text.includes('supabase.co/storage')) ? (
                        <img
                          src={msg.text}
                          className="max-w-[200px] max-h-[300px] rounded-lg object-contain bg-white/10"
                          alt="Attachment"
                          referrerPolicy="no-referrer"
                          onClick={() => window.open(msg.text, '_blank')}
                        />
                      ) : (
                        <p className="leading-relaxed tracking-tight">{msg.text}</p>
                      )}
                    </div>
                    {(!messages[idx + 1] || messages[idx + 1].sender !== msg.sender) && (
                      <div className="flex items-center gap-1.5 mx-1 mt-0.5 text-slate-400">
                        <span className="text-[10px] font-medium">{msg.timestamp}</span>
                        {isCurrentUser && (
                          <span className="material-symbols-outlined text-[12px] text-blue-500 font-bold">done_all</span>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isSending && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-2"
            >
              <div className="h-8 w-8 shrink-0 rounded-full bg-slate-200 overflow-hidden mb-1 bg-cover bg-center border border-white dark:border-slate-800" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCe1VDGLNu29L2tjtO9X_9j6BaW7qkGUPgRyymCOyXsreYhe24X09VXkwDR9o_utvJ-3ww1nDQfnANwLWDZRVJh1gVsb78V6oD-OOhsO1rjyBmg9KsRsHe99iUfJfmTNoTZZNXUrQus75IyHst12S7eT1Msj9OX49lvlya11I2PutDrxd4cH4SEpesbOfLR8qmRRzSyY4bFt9n0sq1H-LzGDz7U5YijkKAN8ncOxBkpM3h_pjCkHhE5h6wsnu95CQH0REcdeFZ_S5k')" }}></div>
              <div className="bg-white dark:bg-[#1a2230] rounded-2xl p-3 border border-slate-100 dark:border-slate-800 shadow-sm flex gap-1 items-center">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Premium Input Area */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-3 pb-[calc(env(safe-area-inset-bottom,16px)+16px)] sm:pb-8 border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)] relative z-20 shrink-0">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (!threadId || !supabase) {
                emitToast('Connecting to support...', 'info');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
              }
              setIsSending(true);
              const url = await uploadChatImage(file, threadId, userId, adminMode);
              if (url) {
                const tempId = 'temp-img-' + Date.now();
                setMessages(prev => [...prev, {
                  id: tempId,
                  text: url,
                  sender: adminMode ? 'admin' : 'user',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  status: 'seen'
                }]);

                // Send as image message
                try {
                  const { data, error } = await supabase
                    .from('chat_messages')
                    .insert({
                      thread_id: threadId,
                      body: url,
                      sender: adminMode ? 'admin' : 'user'
                    })
                    .select()
                    .single();
                  if (error) throw error;
                  setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id.toString() } : m));

                  if (adminMode) {
                    await supabase
                      .from('chat_threads')
                      .update({ last_admin_read_at: new Date().toISOString() })
                      .eq('id', threadId);
                  } else {
                    await supabase
                      .from('chat_threads')
                      .update({ last_user_read_at: new Date().toISOString() })
                      .eq('id', threadId);
                  }
                  emitToast('Image sent', 'success');
                } catch (err) {
                  console.error('Error sending image:', err);
                  setMessages(prev => prev.filter(m => m.id !== tempId));
                  emitToast('Failed to send image', 'error');
                }
              }
              if (fileInputRef.current) fileInputRef.current.value = '';
              setIsSending(false);
            }
          }}
        />
        <div className="flex items-end gap-2 max-w-2xl mx-auto w-full">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors mb-0.5"
          >
            <span className="material-symbols-outlined text-[24px]">add_circle</span>
          </button>

          <div className="flex flex-1 items-end min-h-[46px] rounded-3xl bg-slate-50 dark:bg-slate-800/80 px-2 py-1.5 focus-within:ring-2 focus-within:ring-primary/30 focus-within:bg-white dark:focus-within:bg-slate-800 transition-all border border-slate-200/80 dark:border-slate-700/80 shadow-inner mb-0.5">
            <input
              className="w-full bg-transparent border-none px-3 py-2 text-[15px] text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-0 font-medium"
              placeholder={threadId ? "Message..." : "Connecting..."}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
              disabled={!threadId}
            />
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors mb-0.5 mr-0.5">
              <span className="material-symbols-outlined text-[22px]">sentiment_satisfied</span>
            </button>
          </div>

          {newMessage.trim() ? (
            <button
              onClick={sendMessage}
              disabled={isSending || !threadId}
              className="mb-0.5 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-white transition-all shadow-lg shadow-primary/30 active:scale-90 hover:scale-[1.02]"
            >
              {isSending ? (
                <span className="material-symbols-outlined animate-spin text-[22px]">sync</span>
              ) : (
                <span className="material-symbols-outlined text-[20px] ml-0.5">send</span>
              )}
            </button>
          ) : (
            <button className="mb-0.5 flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary transition-all">
              <span className="material-symbols-outlined text-[22px]">mic</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CartView({ cart, onBack, onUpdateQuantity, onRemove, onNavigate, products }: { cart: CartItem[], onBack: () => void, onUpdateQuantity: (id: number, delta: number) => void, onRemove: (id: number) => void, onNavigate: (view: View) => void, products: Product[], key?: string }) {
  const subtotal = cart.reduce((acc, item) => {
    const product = products.find(p => p.id === item.productId);
    return acc + (product?.price || 0) * item.quantity;
  }, 0);
  const shipping = cart.length > 0 ? 12.50 : 0;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  const totalBoxes = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-screen bg-white dark:bg-slate-900 relative overflow-hidden"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-white dark:bg-slate-900 p-4 pb-2 justify-between border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="text-slate-900 dark:text-white flex size-12 shrink-0 items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <h2 className="text-slate-900 dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center">Shopping Cart</h2>
        <div className="flex w-12 items-center justify-end">
          <button onClick={() => emitToast('Edit mode coming soon.', 'info')} className="text-primary text-base font-bold leading-normal tracking-[0.015em] shrink-0 hover:text-blue-700 transition-colors">Edit</button>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {cart.length > 0 ? (
          cart.map((item) => {
            const product = products.find(p => p.id === item.productId);
            if (!product) return null;
            return (
              <div key={item.productId} className="flex gap-4 bg-white dark:bg-slate-900 px-4 py-4 justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-start gap-4 flex-1">
                  <div
                    className="bg-center bg-no-repeat aspect-square bg-cover rounded-lg size-[80px] shadow-sm bg-slate-100 dark:bg-slate-800"
                    style={{ backgroundImage: `url("${product.image}")` }}
                  ></div>
                  <div className="flex flex-1 flex-col justify-center h-full py-1">
                    <p className="text-slate-900 dark:text-white text-base font-semibold leading-tight line-clamp-2 mb-1">{product.name}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-normal leading-normal mb-2">{product.lang === 'Jpn' ? 'Japanese' : 'English'} Edition</p>
                    <p className="text-primary text-base font-bold leading-normal">${product.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="shrink-0 flex flex-col justify-between items-end">
                  <button onClick={() => onRemove(item.productId)} className="text-slate-400 hover:text-red-500 transition-colors mb-2">
                    <span className="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                  <div className="flex items-center gap-3 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 rounded-lg p-1">
                    <button
                      onClick={() => onUpdateQuantity(item.productId, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">remove</span>
                    </button>
                    <span className="text-sm font-semibold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.productId, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-white dark:bg-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <span className="material-symbols-outlined text-3xl">shopping_cart_off</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Your cart is empty</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">Looks like you haven't added any booster boxes to your cart yet.</p>
            <button onClick={onBack} className="mt-6 bg-primary text-white px-6 py-2 rounded-full font-bold">Start Shopping</button>
          </div>
        )}

        {cart.length > 0 && (
          <>
            {/* Summary / Promo Code */}
            <div className="p-4 mt-2">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                <span className="material-symbols-outlined text-slate-400 dark:text-slate-500">sell</span>
                <input className="bg-transparent border-none outline-none text-sm text-slate-900 dark:text-white placeholder-slate-400 flex-1 focus:ring-0" placeholder="Promo Code" type="text" />
                <button onClick={() => emitToast('Promo codes are not enabled yet.', 'info')} className="text-primary text-sm font-semibold">Apply</button>
              </div>
            </div>

            {/* Order Summary Breakdown */}
            <div className="px-6 py-4 space-y-3 bg-white dark:bg-slate-900">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Subtotal</p>
                <p className="text-slate-900 dark:text-white text-sm font-medium">${subtotal.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Shipping</p>
                <p className="text-slate-900 dark:text-white text-sm font-medium">${shipping.toFixed(2)}</p>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-slate-500 dark:text-slate-400 text-sm">Tax (8%)</p>
                <p className="text-slate-900 dark:text-white text-sm font-medium">${tax.toFixed(2)}</p>
              </div>
              <div className="h-px w-full bg-slate-100 dark:bg-slate-800 my-2"></div>
              <div className="flex justify-between items-center">
                <p className="text-slate-900 dark:text-white text-base font-bold">Total</p>
                <p className="text-primary text-xl font-bold">${total.toFixed(2)}</p>
              </div>
            </div>
          </>
        )}
        <div className="h-6"></div>
      </div>

      {/* Sticky Footer Checkout Button */}
      {cart.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 px-6 py-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
          {totalBoxes < 5 ? (
            <div className="flex flex-col gap-2">
              <p className="text-red-500 text-sm font-semibold text-center mb-1">You cannot buy less than 5 boxes. Please select more.</p>
              <button disabled className="w-full bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold py-4 px-6 rounded-xl flex items-center justify-between transition-colors cursor-not-allowed border border-slate-300 dark:border-slate-700">
                <span className="text-base font-semibold">Checkout</span>
                <span className="text-base font-bold">${total.toFixed(2)}</span>
              </button>
            </div>
          ) : (
            <button onClick={() => onNavigate('payment')} className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-between transition-colors shadow-lg shadow-blue-500/30">
              <span className="text-base font-semibold">Checkout</span>
              <span className="text-base font-bold">${total.toFixed(2)}</span>
            </button>
          )}
        </div>
      )}

    </motion.div>
  );
}

function FullImageView({ imageUrl, onBack }: { imageUrl: string, onBack: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-4"
    >
      <button
        onClick={onBack}
        className="absolute top-8 right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <span className="material-symbols-outlined text-3xl">close</span>
      </button>
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <img
          src={imageUrl}
          alt="Full view"
          className="max-w-full max-h-full object-contain drop-shadow-2xl"
          referrerPolicy="no-referrer"
        />
      </motion.div>
    </motion.div>
  );
}

function ProductDetailView({ productId, onBack, isFavorite, onToggleFavorite, onAddToCart, products }: { productId: number | null, onBack: () => void, isFavorite: boolean, onToggleFavorite: () => void, onAddToCart: () => void, products: Product[], key?: string }) {
  const product = products.find(p => p.id === productId);
  const [activeThumb, setActiveThumb] = useState(0);
  const [isFullViewOpen, setIsFullViewOpen] = useState(false);

  if (!product) return null;

  const rating = product.rating || 4.5;
  const reviews = product.reviews || 0;
  const description = product.description || "No description available.";
  const features = product.features || [];
  const thumbnails = (product.thumbnails && product.thumbnails.length > 0
    ? product.thumbnails
    : [product.image]
  ).filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  const displayImage = thumbnails[activeThumb] || product.image || LOGO_URL;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col h-screen bg-white dark:bg-slate-900 relative overflow-hidden z-50"
    >
      <AnimatePresence>
        {isFullViewOpen && (
          <FullImageView
            imageUrl={displayImage}
            onBack={() => setIsFullViewOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Header Overlay */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20">
        <button onClick={onBack} className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors">
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
        <button onClick={onToggleFavorite} className="flex size-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors">
          <span className={`material-symbols-outlined text-[24px] ${isFavorite ? 'filled text-red-500' : ''}`}>favorite</span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-8 lg:p-8">

            {/* Left Column: Image Area */}
            <div className="relative">
              <div
                className="relative w-full aspect-[4/3] lg:aspect-square bg-slate-100 dark:bg-slate-800 cursor-zoom-in lg:rounded-3xl overflow-hidden shadow-xl"
                onClick={() => setIsFullViewOpen(true)}
              >
                <motion.img
                  key={activeThumb}
                  referrerPolicy="no-referrer"
                  src={displayImage}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full object-cover"
                />
                {/* Carousel Indicators */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {thumbnails.map((_, idx) => (
                    <div key={idx} className={`w-2 h-2 rounded-full shadow-sm transition-all ${idx === activeThumb ? 'bg-white' : 'bg-white/50'}`}></div>
                  ))}
                </div>
              </div>

              {/* Thumbnails Gallery - Desktop below main image, Mobile below main image */}
              <div className="flex w-full overflow-x-auto px-4 lg:px-0 py-6 lg:py-4 gap-3 no-scrollbar">
                {thumbnails.map((thumb, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveThumb(idx)}
                    className={`relative flex-none w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden border-2 transition-all ${idx === activeThumb
                      ? 'border-primary shadow-lg shadow-primary/20 scale-105'
                      : 'border-slate-100 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img referrerPolicy="no-referrer" src={thumb} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Right Column: Details Area */}
            <div className="flex flex-col">
              {/* Main Info Card - The "Middle" Details (Mobile: Overlaps, Desktop: Regular Flow) */}
              <div className="px-4 -mt-12 lg:mt-0 relative z-10 lg:z-0">
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] lg:rounded-3xl p-8 shadow-2xl lg:shadow-none shadow-black/10 border border-slate-100 dark:border-slate-700">
                  <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                    <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-widest mb-3">
                      {product.series}
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-bold leading-tight text-slate-900 dark:text-white mb-2">{product.name}</h1>

                    <div className="flex items-center gap-2 mb-6">
                      <div className="flex items-center text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`material-symbols-outlined text-[20px] ${i < Math.floor(rating) ? 'filled' : ''}`}>
                            {i < Math.floor(rating) ? 'star' : (i < rating ? 'star_half' : 'star')}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm text-slate-500 font-medium">({reviews} Reviews)</span>
                    </div>

                    <div className="w-full flex items-center justify-center lg:justify-start gap-4 mb-2">
                      <div className="flex flex-col items-center lg:items-start">
                        <p className="text-primary dark:text-blue-400 text-4xl font-black leading-tight">${product.price.toFixed(2)}</p>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Market Price</p>
                      </div>
                      <div className="h-12 w-px bg-slate-100 dark:bg-slate-700 mx-2"></div>
                      <div className="flex flex-col items-center lg:items-start">
                        <div className="flex items-center gap-2">
                          {product.inStock !== false && (
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                            </span>
                          )}
                          <p className={`text-xl font-bold leading-tight ${product.inStock !== false ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                            }`}>
                            {product.inStock !== false ? "In Stock" : "Sold Out"}
                          </p>
                        </div>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Availability</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Info Sections */}
              <div className="px-6 lg:px-0 space-y-8 mt-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 bg-primary rounded-full"></div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Product Description</h3>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-base leading-relaxed">
                    {description.split('36 booster packs').map((part, i, arr) => (
                      <span key={i}>
                        {part}
                        {i < arr.length - 1 && <span className="font-bold text-slate-900 dark:text-white">36 booster packs</span>}
                      </span>
                    ))}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    {features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <span className="material-symbols-outlined text-[20px]">
                            {i === 0 ? 'verified_user' : (i === 1 ? 'package_2' : 'cards')}
                          </span>
                        </div>
                        <span className="text-slate-700 dark:text-slate-200 text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="my-2 border-slate-100 dark:border-slate-800" />

                {/* Accordion Section */}
                <div className="flex flex-col gap-4">
                  <details className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                    <summary className="flex cursor-pointer items-center justify-between p-5 font-bold text-slate-900 dark:text-white marker:content-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined">local_shipping</span>
                        </div>
                        <span>Shipping Information</span>
                      </div>
                      <span className="material-symbols-outlined transition group-open:rotate-180">expand_more</span>
                    </summary>
                    <div className="p-5 pt-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p className="mb-3">Free shipping on orders over $200. Standard shipping (3-5 business days) is $5.99.</p>
                      <p>All booster boxes are shipped in protective bubble wrap and a sturdy cardboard box to prevent damage.</p>
                    </div>
                  </details>
                  <details className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
                    <summary className="flex cursor-pointer items-center justify-between p-5 font-bold text-slate-900 dark:text-white marker:content-none hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined">assignment_return</span>
                        </div>
                        <span>Return Policy</span>
                      </div>
                      <span className="material-symbols-outlined transition group-open:rotate-180">expand_more</span>
                    </summary>
                    <div className="p-5 pt-0 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      <p>Returns accepted within 30 days for unopened, factory-sealed items only. Buyer pays return shipping unless item is defective.</p>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Action */}
      <div className="fixed bottom-[84px] left-0 right-0 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 z-[70]">
        <div className="flex gap-3 max-w-md mx-auto">
          <button
            onClick={onBack}
            className="shrink-0 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="flex flex-col justify-center">
            <span className="text-xs text-slate-500 uppercase font-semibold">Total Price</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">${product.price.toFixed(2)}</span>
          </div>
          <button
            onClick={onAddToCart}
            className="flex-1 bg-primary hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined">shopping_cart</span>
            Add to Cart
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function PaymentView({ onBack, total, onPaid, onOtherPayment, products }: { onBack: () => void; total: number; onPaid: () => void; onOtherPayment: () => void; products: Product[]; key?: string }) {
  const COINBASE_API_KEY = '663f548e-7abc-4143-bb26-e1e62438b82d';
  const [status, setStatus] = useState<'idle' | 'creating' | 'awaiting' | 'paid' | 'error'>('idle');
  const [chargeUrl, setChargeUrl] = useState<string | null>(null);
  const [chargeCode, setChargeCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const createCharge = async () => {
    if (status !== 'idle') return;
    setStatus('creating');
    setErrorMsg(null);
    try {
      const res = await fetch('https://api.commerce.coinbase.com/charges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CC-Api-Key': COINBASE_API_KEY,
          'X-CC-Version': '2018-03-22'
        },
        body: JSON.stringify({
          name: 'Chris TCG Booster Box Order',
          description: `Purchase - ${products.length ? 'Booster Boxes' : 'Items'}`,
          pricing_type: 'fixed_price',
          local_price: { amount: total.toFixed(2), currency: 'USD' },
          metadata: { created_at: new Date().toISOString() }
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error?.message || 'Coinbase API error');
      const data = json.data;
      setChargeUrl(data.hosted_url);
      setChargeCode(data.code);
      setStatus('awaiting');
      // Open checkout in a new tab
      window.open(data.hosted_url, '_blank');
      // Poll for payment confirmation every 5 seconds
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`https://api.commerce.coinbase.com/charges/${data.code}`, {
            headers: { 'X-CC-Api-Key': COINBASE_API_KEY, 'X-CC-Version': '2018-03-22' }
          });
          const pollJson = await pollRes.json();
          const timeline = pollJson.data?.timeline || [];
          const confirmed = timeline.find((t: any) => t.status === 'COMPLETED' || t.status === 'CONFIRMED');
          if (confirmed) {
            clearInterval(pollRef.current!);
            setStatus('paid');
            emitToast('✅ Payment confirmed via Coinbase!', 'success');
          }
        } catch { /* ignore poll errors */ }
      }, 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create Coinbase charge');
      setStatus('error');
      emitToast(err.message || 'Failed to create charge', 'error');
    }
  };

  // Cleanup poll on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const confirmOrder = () => {
    if (status !== 'paid') {
      emitToast('Waiting for payment confirmation...', 'error');
      return;
    }
    onPaid();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-screen bg-white dark:bg-slate-900"
    >
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="px-4 py-3 flex items-center justify-between">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white">Payment</h1>
          <button onClick={onOtherPayment} className="text-primary text-sm font-semibold px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
            Other
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-28 no-scrollbar">
        <div className="p-4 flex flex-col gap-4">
          {/* Total */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Total due</p>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">${total.toFixed(2)}</p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-white dark:bg-slate-900 px-3 py-1.5 border border-slate-200 dark:border-slate-700">
                <span className="material-symbols-outlined text-[18px] text-slate-500">currency_bitcoin</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Coinbase Commerce</span>
              </div>
            </div>
          </div>

          {/* Coinbase Card */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[18px]">currency_bitcoin</span>
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">Pay with Coinbase</h2>
                  <p className="text-xs text-slate-500">Crypto payments accepted</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${status === 'paid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                : status === 'awaiting' ? 'bg-amber-100 text-amber-700'
                  : status === 'creating' ? 'bg-blue-100 text-blue-700'
                    : status === 'error' ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}>
                {status === 'paid' ? '✅ Confirmed' : status === 'awaiting' ? '⌛ Awaiting...' : status === 'creating' ? 'Creating...' : status === 'error' ? 'Error' : 'Ready'}
              </span>
            </div>

            {status === 'error' && errorMsg && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{errorMsg}</p>
              </div>
            )}

            {status === 'awaiting' && chargeUrl && (
              <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">✅ Checkout page opened in a new tab. Complete payment there, then return here.</p>
                <a href={chargeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline font-semibold">Re-open Coinbase Checkout ↗</a>
                <p className="text-xs text-slate-500 mt-2">Charge Code: <span className="font-mono font-bold">{chargeCode}</span></p>
                <p className="text-xs text-slate-400 mt-1">This page will automatically detect your payment...</p>
              </div>
            )}

            <button
              onClick={createCharge}
              disabled={status !== 'idle' && status !== 'error'}
              className={`w-full rounded-xl px-4 py-3.5 font-bold text-white flex items-center justify-center gap-2 transition-all ${status !== 'idle' && status !== 'error' ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-black active:scale-[0.98] shadow-lg'
                }`}
            >
              {status === 'creating' ? (
                <><span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></span> Creating Charge...</>
              ) : status === 'error' ? (
                <><span className="material-symbols-outlined text-[18px]">refresh</span> Retry Payment</>
              ) : (
                <><span className="material-symbols-outlined text-[18px]">open_in_new</span> Pay {`$${total.toFixed(2)}`} with Coinbase</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg border-t border-slate-100 dark:border-slate-800 px-4 py-4 z-[80]">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={confirmOrder}
            disabled={status !== 'paid'}
            className={`flex-1 font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all ${status === 'paid'
              ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 active:scale-[0.98]'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
          >
            <span className="material-symbols-outlined">check_circle</span>
            {status === 'paid' ? 'Confirm Order' : 'Waiting for payment...'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsView({ onBack, onNavigate, theme, toggleTheme, isAdminMode, onExitAdmin }: { onBack: () => void, onNavigate: (view: View) => void, theme: 'light' | 'dark', toggleTheme: () => void, isAdminMode?: boolean, onExitAdmin?: () => void, key?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-screen bg-surface-light dark:bg-surface-dark relative overflow-hidden"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center bg-surface-light dark:bg-surface-dark p-4 pb-2 justify-between border-b border-gray-100 dark:border-gray-800">
        <button onClick={onBack} className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <span className="material-symbols-outlined text-text-main dark:text-white" style={{ fontSize: '24px' }}>arrow_back</span>
        </button>
        <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">Settings & Profile</h2>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {/* Account Section */}
        <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-6">Account</h3>
        <div className="flex flex-col gap-1">
          {/* Profile Item */}
          <button className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark px-4 py-3 justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 size-10 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
              </div>
              <div className="flex flex-col items-start">
                <p className="text-text-main dark:text-white text-base font-medium leading-normal">Account Profile</p>
                <p className="text-text-sub dark:text-gray-400 text-xs">Manage personal details</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>chevron_right</span>
          </button>
          {/* Payment Methods */}
          <button className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark px-4 py-3 justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 size-10 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>currency_bitcoin</span>
              </div>
              <div className="flex flex-col items-start">
                <p className="text-text-main dark:text-white text-base font-medium leading-normal">Payment Methods</p>
                <p className="text-text-sub dark:text-gray-400 text-xs">Coinbase</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>chevron_right</span>
          </button>
          {/* Shipping Addresses */}
          <button className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark px-4 py-3 justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 size-10 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>local_shipping</span>
              </div>
              <div className="flex flex-col items-start">
                <p className="text-text-main dark:text-white text-base font-medium leading-normal">Shipping Addresses</p>
                <p className="text-text-sub dark:text-gray-400 text-xs">2 addresses saved</p>
              </div>
            </div>
            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>chevron_right</span>
          </button>
        </div>

        {/* Theme Settings */}
        <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Appearance</h3>
        <div className="px-4">
          <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">{theme === 'dark' ? 'dark_mode' : 'light_mode'}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</p>
                <p className="text-[10px] text-slate-500 font-medium">Switch app appearance</p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full transition-all relative ${theme === 'dark' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <motion.div
                animate={{ x: theme === 'dark' ? 26 : 2 }}
                className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
              />
            </button>
          </div>
        </div>
        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4 my-2"></div>

        <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Notifications</h3>
        <div className="px-4">
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Live alerts are managed from the bell icon.</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Unread messages appear as red badges in both user and admin views.</p>
          </div>
        </div>
        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4 my-2"></div>

        {/* Support Section */}
        <h3 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] px-4 pb-2 pt-4">Support</h3>
        <div className="flex flex-col gap-1 pb-4">
          <button className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark px-4 py-3 justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 size-10 group-hover:bg-primary group-hover:text-white transition-colors">
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>help</span>
              </div>
              <p className="text-text-main dark:text-white text-base font-medium leading-normal">Help Center</p>
            </div>
            <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '20px' }}>open_in_new</span>
          </button>
          {isAdminMode && onExitAdmin && (
            <button onClick={() => { onExitAdmin(); onNavigate('home'); }} className="flex items-center gap-4 bg-surface-light dark:bg-surface-dark px-4 py-3 justify-between hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center rounded-xl bg-red-100 text-red-600 shrink-0 size-10 group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>admin_panel_settings</span>
                </div>
                <p className="text-red-600 text-base font-medium leading-normal">Exit Admin Mode</p>
              </div>
            </button>
          )}
        </div>
        <div className="flex justify-center py-6">
          <p className="text-xs text-text-sub dark:text-gray-500">Version 2.4.1 (Build 20231024)</p>
        </div>
      </div>
    </motion.div>
  );
}

function NavItem({ icon, label, active = false, onClick, badgeCount = 0 }: { icon: string; label: string; active?: boolean; onClick: () => void, badgeCount?: number }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center gap-1 transition-all ${active ? 'text-primary scale-110' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
        }`}
    >
      <div className="relative" data-cart-target={icon === 'shopping_cart' ? 'true' : undefined}>
        <span className={`material-symbols-outlined text-[24px] ${active ? 'filled' : ''}`}>
          {icon}
        </span>
        {badgeCount > 0 && (
          <motion.span
            key={badgeCount}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900"
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </motion.span>
        )}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
      className="relative flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-background-light dark:bg-background-dark"
    >
      {/* Subtle Geometric Background Pattern */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary blur-[100px]"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 animate-fade-in-up">
        {/* Logo / Icon Area */}
        <div className="relative flex items-center justify-center">
          {/* Decorative Ring */}
          <div className="absolute inset-0 rounded-full border border-primary/20 scale-150"></div>
          <div
            className="bg-center bg-no-repeat bg-contain w-32 h-32 drop-shadow-2xl"
            style={{ backgroundImage: `url("${LOGO_URL}")` }}
          ></div>
        </div>

        {/* Text Content */}
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-slate-900 dark:text-slate-100 text-3xl font-bold tracking-tight">
            CHRIS TCG
          </h1>
          <p className="text-primary font-medium text-sm tracking-[0.2em] uppercase">
            Booster Box
          </p>
        </div>

        {/* Loading Indicator */}
        <div className="mt-8 flex gap-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
          <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse delay-75"></div>
          <div className="h-2 w-2 rounded-full bg-primary/30 animate-pulse delay-150"></div>
        </div>
      </div>

      {/* Bottom Branding/Version */}
      <div className="absolute bottom-8 text-slate-400 dark:text-slate-600 text-xs font-medium tracking-wide">
        v2.0.0 Premium Edition
      </div>
    </motion.div>
  );
}


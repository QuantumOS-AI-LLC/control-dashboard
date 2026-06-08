import { create } from 'zustand';

interface FormData {
  customerName: string;
  customerEmail: string;
  address: string;
  customerPhone: string;
  dispatchNotes: string;
  scheduledDate: string;
  scheduledTime: string;
  foremanId: string;
  crewIds: string[];
  // Fencing business flow fields
  fenceTypes: string[];
  installationType: string;
  followUpDate: string;
  generalNotes: string;
  priceRange: string;
  detailedJobDescription: string;
  othersInvolved: string;
  preCloseStatus: string;
  estimateLocation: string;
  frostHeight: string;
  frostPrivacySlats: boolean | null;
  frostColor: string;
  exactPrice: number | null;
  depositValue: number | null;
  depositReceived: boolean | null;
  timeline: string;
  accessSkidExcavator: boolean | null;
  bringBackDirt: boolean | null;
  planFileUrl: string;
  localisationCertificateUrl: string;
  estimateDate: string;
  estimateTime: string;
}

interface JobModalState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;

  formData: FormData;
  setFormData: (data: Partial<FormData>) => void;
  resetFormData: () => void;

  selectedContactId: string | null;
  setSelectedContactId: (id: string | null) => void;
}

const defaultFormData: FormData = {
  customerName: "",
  customerEmail: "",
  address: "",
  customerPhone: "",
  dispatchNotes: "",
  scheduledDate: new Date().toISOString().split('T')[0],
  scheduledTime: "",
  foremanId: "",
  crewIds: [],
  fenceTypes: [],
  installationType: "",
  followUpDate: "",
  generalNotes: "",
  priceRange: "",
  detailedJobDescription: "",
  othersInvolved: "",
  preCloseStatus: "",
  estimateLocation: "",
  frostHeight: "",
  frostPrivacySlats: null,
  frostColor: "",
  exactPrice: null,
  depositValue: null,
  depositReceived: null,
  timeline: "",
  accessSkidExcavator: null,
  bringBackDirt: null,
  planFileUrl: "",
  localisationCertificateUrl: "",
  estimateDate: "",
  estimateTime: ""
};

export const useJobModalStore = create<JobModalState>((set) => ({
  isOpen: false,
  setIsOpen: (isOpen) => set({ isOpen }),

  formData: defaultFormData,
  setFormData: (data) => set((state) => ({ formData: { ...state.formData, ...data } })),
  resetFormData: () => set({ formData: defaultFormData, selectedContactId: null }),

  selectedContactId: null,
  setSelectedContactId: (id) => set({ selectedContactId: id })
}));

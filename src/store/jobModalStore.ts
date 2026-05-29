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
  frostPrivacySlats: boolean;
  frostColor: string;
  exactPrice: number;
  depositValue: number;
  depositReceived: boolean;
  timeline: string;
  accessSkidExcavator: boolean;
  bringBackDirt: boolean;
  planFileUrl: string;
  localisationCertificateUrl: string;
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
  scheduledTime: "08:00",
  foremanId: "",
  crewIds: [],
  fenceTypes: [],
  installationType: "In ground",
  followUpDate: "",
  generalNotes: "",
  priceRange: "",
  detailedJobDescription: "",
  othersInvolved: "",
  preCloseStatus: "Medium",
  estimateLocation: "",
  frostHeight: "4",
  frostPrivacySlats: false,
  frostColor: "black",
  exactPrice: 0,
  depositValue: 0,
  depositReceived: false,
  timeline: "Mid-April",
  accessSkidExcavator: false,
  bringBackDirt: false,
  planFileUrl: "",
  localisationCertificateUrl: ""
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

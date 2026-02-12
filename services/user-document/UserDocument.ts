import axios from "@/lib/axios";

export const getRentStatus = async (lang:string, rentId:string) => {
    try {
        const response = await axios.get(`rent/status/${lang}/${rentId}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching rent status:', error);
        throw error;
    }
};


export const getUserDocuments = async () => {
  try {
    const response = await axios.get("user/documents");
    return response.data; // همون JSON یکپارچه‌ای که بک‌اند میده
  } catch (error) {
    console.error("Error fetching user documents:", error);
    throw error;
  }
};


export type DocumentType =
  | "identity"
  | "driver_license"
  | "international_driver_license"
  | "visa";

export type DocumentSide = "single" | "front" | "back";

export const uploadUserDocumentSingle = async (
  type: DocumentType,
  side: DocumentSide,
  file: File
) => {
  try {
    const formData = new FormData();
    formData.append("type", type);
    formData.append("side", side);
    formData.append("file", file);

    const response = await axios.post("user/documents/single", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data; // { ok: true, data: ... }
  } catch (error) {
    console.error("Error uploading single document:", error);
    throw error;
  }
};


/** ✅ آپلود با FormData (partial upload) */
export const uploadUserDocumentsFormData = async (formData: FormData) => {
  // مهم: Content-Type رو ست نکن، axios خودش boundary رو درست میذاره
  const response = await axios.post("user/documents", formData);
  return response.data;
};




export type UploadDocumentsPayload = {
  identity_file: File;
  driver_license_front: File;
  driver_license_back: File;

  intl_driver_license_front?: File | null;
  intl_driver_license_back?: File | null;

  visa_file?: File | null;
};

export const uploadUserDocuments = async (payload: UploadDocumentsPayload) => {
  try {
    const formData = new FormData();

    // required
    formData.append("identity_file", payload.identity_file);
    formData.append("driver_license_front", payload.driver_license_front);
    formData.append("driver_license_back", payload.driver_license_back);

    // optional
    if (payload.intl_driver_license_front) {
      formData.append("intl_driver_license_front", payload.intl_driver_license_front);
    }
    if (payload.intl_driver_license_back) {
      formData.append("intl_driver_license_back", payload.intl_driver_license_back);
    }
    if (payload.visa_file) {
      formData.append("visa_file", payload.visa_file);
    }

    const response = await axios.post("user/documents", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data; // { ok: true, data: [...] }
  } catch (error) {
    console.error("Error uploading documents:", error);
    throw error;
  }
};



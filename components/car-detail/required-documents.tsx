/* eslint-disable @typescript-eslint/no-explicit-any */
import { FileCheck, FileText, CreditCard, Camera, Info } from "lucide-react";
import { getTranslations } from "next-intl/server";

export async function RequiredDocuments({ branch, car }: { branch?: string; car?: string }) {
  const t = await getTranslations("requiredDocuments");

  const documentsIran = [
    { icon: FileText, label: t("docs.passport") },
    { icon: FileCheck, label: t("docs.intlLicense") },
    { icon: Camera, label: t("docs.ticketPhoto") },
  ];

  const documentsUAE = [
    { icon: CreditCard, label: t("docs.validVisa") },
    { icon: FileText, label: t("docs.emiratesId") },
    { icon: FileCheck, label: t("docs.uaeLicense") },
    { icon: Camera, label: t("docs.ticketPhoto") },
  ];

  return (
    <div>
      <h3 className="text-gray-900 font-semibold mb-4">
        {t("title", { car: car ?? "", branch: branch ?? "" })}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-lg p-4">
        {/* Iran residents */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" />
            {t("iranResidents")}
          </h4>
          <ul className="space-y-2">
            {documentsIran.map((doc, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-gray-600 text-sm"
              >
                <doc.icon className="w-4 h-4 text-gray-400" />
                <span>{doc.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* UAE residents */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" />
            {t("uaeResidents")}
          </h4>
          <ul className="space-y-2">
            {documentsUAE.map((doc, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-gray-600 text-sm"
              >
                <doc.icon className="w-4 h-4 text-gray-400" />
                <span>{doc.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-gray-500 text-xs flex gap-2 items-center">
          <Info width={12} height={12} />
          {t("note")}
        </p>
      </div>
    </div>
  );
}
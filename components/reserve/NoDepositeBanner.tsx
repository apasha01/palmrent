"use client";

import * as React from "react";
import { Banknote, BanknoteX, Coins, Info, Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppDrawer } from "@/components/common/AppDrawer";

export default function NoDepositBanner() {
  const t = useTranslations("InformationStep");

  return (
    <div className="w-full overflow-hidden rounded-xl border mb-2">
      
      {/* Top Green Section */}
      <div className="flex items-center gap-2 bg-green-100 px-2 py-4">
        
        <div className="text-green-700">
          <BanknoteX size={26} />
        </div>

        <div className="flex-1">
          <AppDrawer
            kind="no_deposit"
            data={{}}
            trigger={({ open }) => (
              <div
                className="font-semibold text-green-800 text-base flex items-center gap-2 cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  open();
                }}
              >
                {t("noDepositBanner.title")}
                <span className="text-green-700">
                  <Info size={16} />
                </span>
              </div>
            )}
          />

          <p className="text-sm text-green-700 mt-1 leading-6">
            {t("noDepositBanner.desc")}
          </p>
        </div>
      </div>

      {/* Bottom White Section */}
      <div className="flex items-center justify-between bg-white px-4 py-3 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Wallet size={18} className="text-gray-400" />
          <span className="font-medium">
            {t("noDepositBanner.penaltyDeposit")} :
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-blue-500">0</span>
          <span>{t("noDepositBanner.currency")}</span>
        </div>
      </div>
    </div>
  );
}
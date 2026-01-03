import { changeDeliveryLocation, changeIsLocationPopupOpen, changeReturnLocation } from "@/redux/slices/globalSlice";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IconClose, IconTick2 } from "./Icons";

export default function LocationPopup({ isReturn, places = [] }) {
    const t = useTranslations();
    const [isDesiredChecked, setIsDesiredChecked] = useState(false);

    const deliveryLocation = useSelector((state) => state.global.deliveryLocation);
    const returnLocation = useSelector((state) => state.global.returnLocation);

    // ✅ Fix: حذف آیتم‌های null/undefined از places تا item.id خطا نده
    const activePlaces = useMemo(() => {
        return Array.isArray(places) ? places.filter(Boolean) : [];
    }, [places]);

    const dispatch = useDispatch();

    function closePopup() {
        dispatch(changeIsLocationPopupOpen(false));
    }

    function inputChangeHandler(targetValue) {
        const action = isReturn ? changeReturnLocation : changeDeliveryLocation;

        if (targetValue === "desired") {
            setIsDesiredChecked(true);
            dispatch(action({ isDesired: true, location: "", address: "" }));
        } else {
            setIsDesiredChecked(false);
            dispatch(action({ isDesired: false, location: targetValue, address: "" }));
        }
    }

    function desiredInputChangeHandler(inputValue) {
        const action = isReturn ? changeReturnLocation : changeDeliveryLocation;
        dispatch(action({ isDesired: true, location: "desired", address: inputValue }));
    }

    useEffect(() => {
        const currentLocation = isReturn ? returnLocation : deliveryLocation;
        if (currentLocation?.isDesired) {
            setIsDesiredChecked(true);
        } else {
            setIsDesiredChecked(false);
        }
    }, [isReturn, deliveryLocation, returnLocation]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop */}
            <div
                onClick={closePopup}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-opacity cursor-pointer"
            ></div>

            {/* Modal */}
            <div className="relative bg-white z-[101] rounded-2xl w-[90%] md:w-[450px] shadow-2xl animate-fade-in2 overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="w-full border-b border-gray-100 p-4 flex justify-between items-center bg-gray-50 shrink-0">
                    <span className="font-bold text-gray-800 text-lg">
                        {isReturn ? t("chooseRetLoc") : t("chooseDelLoc")}
                    </span>
                    <button onClick={closePopup} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                        <IconClose className="size-4 text-gray-600" />
                    </button>
                </div>

                {/* List */}
                <div className="p-4 flex flex-col gap-2 overflow-y-auto">
                    {activePlaces.map((item, index) => (
                        <label
                            key={item?.id ?? index}
                            className="flex gap-3 items-center cursor-pointer p-3 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all select-none"
                        >
                            <input
                                checked={
                                    isReturn
                                        ? (!returnLocation?.isDesired && String(returnLocation?.location) === String(item?.id))
                                        : (!deliveryLocation?.isDesired && String(deliveryLocation?.location) === String(item?.id))
                                }
                                onChange={(event) => inputChangeHandler(event.target.value)}
                                type="radio"
                                value={item?.id ?? ""}
                                name="location"
                                className="peer hidden"
                            />

                            <div className="size-5 shrink-0 rounded-full border-2 border-gray-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 flex items-center justify-center">
                                <IconTick2 className="text-white size-3 hidden peer-checked:block" />
                            </div>

                            <div className="flex flex-col">
                                <span className="font-medium text-gray-700 text-sm">{item?.title}</span>
                                {parseInt(item?.price_pay) > 0 && (
                                    <span className="text-xs text-gray-500 mt-0.5">
                                        {t("expense")}: {item?.price_pay}
                                    </span>
                                )}
                            </div>
                        </label>
                    ))}

                    {/* Desired Location */}
                    <div className="border-t border-gray-100 mt-2 pt-2">
                        <label className="flex gap-3 items-center cursor-pointer p-3 rounded-xl border border-transparent hover:border-blue-200 hover:bg-blue-50 transition-all select-none">
                            <input
                                checked={isDesiredChecked}
                                onChange={(event) => inputChangeHandler(event.target.value)}
                                type="radio"
                                name="location"
                                value={"desired"}
                                className="peer hidden"
                            />
                            <div className="size-5 shrink-0 rounded-full border-2 border-gray-300 peer-checked:border-blue-500 peer-checked:bg-blue-500 flex items-center justify-center">
                                <IconTick2 className="text-white size-3 hidden peer-checked:block" />
                            </div>
                            <div className="font-medium text-gray-700 text-sm">{t("optionalLocation")}</div>
                        </label>

                        <div
                            className={`grid transition-all duration-300 ease-in-out ${
                                isDesiredChecked ? "grid-rows-[1fr] opacity-100 mt-2" : "grid-rows-[0fr] opacity-0"
                            }`}
                        >
                            <div className="overflow-hidden px-1">
                                <div className="text-xs text-gray-500 mb-1">{t("optionalTitle")}</div>
                                <div className="w-full border border-gray-300 rounded-lg focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white">
                                    <input
                                        value={isDesiredChecked ? (isReturn ? returnLocation?.address : deliveryLocation?.address) || "" : ""}
                                        onChange={(event) => desiredInputChangeHandler(event.target.value)}
                                        className="w-full p-2.5 outline-none text-sm bg-transparent rounded-lg"
                                        type="text"
                                        placeholder={t("location")}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={closePopup}
                        className="w-full cursor-pointer mt-4 bg-[#3B82F6] hover:bg-[#2563EB] rounded-xl text-white font-bold py-3 transition-all shadow-lg shadow-blue-200 active:scale-95"
                    >
                        {t("done")}
                    </button>
                </div>
            </div>
        </div>
    );
}

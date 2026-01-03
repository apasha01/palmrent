'use client';

import { useClickOutside } from "@/hooks/useClickOutside";
import { useDebounce } from "@/hooks/useDebounce";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

// Redux Actions
import { changeFilterStatus } from "@/redux/slices/globalSlice";
import { changeSearchTitle, changeSort, toggleSelectedCategory } from "@/redux/slices/searchSlice";

// Icons
import {
  Icon7Plus,
  IconBusiness,
  IconClose,
  IconCoupe,
  IconCrook,
  IconEconemy,
  IconFilter,
  IconLuxury,
  IconNoDeposite,
  IconSearch3, IconSort,
  IconSport,
  IconStandard,
  IconSuv
} from "./Icons";

export function SearchBox({ searchDisable = false }) {
    const t = useTranslations();
    const dispatch = useDispatch();

    // Redux State
    const searchOrder = useSelector((state) => state.search.sort);
    const selectedCategories = useSelector((state) => state.search.selectedCategories);
    const isHeaderClose = useSelector((state) => state.global.isHeaderClose);
    const reduxSearchTitle = useSelector((state) => state.search.search_title);

    // Local State
    const [searchValue, setSearchValue] = useState(reduxSearchTitle || '');
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Debounce
    const debouncedSearchTerm = useDebounce(searchValue, 800);

    const sortRef = useClickOutside(() => {
        setIsSortOpen(false);
    });

    const [sortList] = useState([
        { id: 14, icon: <IconNoDeposite />, title: 'noDeposite' },
        { id: 3, icon: <IconEconemy />, title: 'economicCar' },
        { id: 13, icon: <IconLuxury />, title: 'luxCar' },
        { id: 15, icon: <Icon7Plus />, title: 'sevenplus' },
        { id: 19, icon: <IconSport />, title: 'sport' },
        { id: 18, icon: <IconBusiness />, title: 'business' },
        { id: 21, icon: <IconCrook />, title: 'crook' },
        { id: 17, icon: <IconStandard />, title: 'standard' },
        { id: 9, icon: <IconSuv />, title: 'suv' },
        { id: 20, icon: <IconCoupe />, title: 'coupe' },
    ]);

    // Dispatch Search Title changes
    useEffect(() => {
        if (debouncedSearchTerm !== undefined) {
            dispatch(changeSearchTitle(debouncedSearchTerm));
        }
    }, [debouncedSearchTerm]);

    const handleSortChange = (sortType) => {
        dispatch(changeSort(sortType));
        setIsSortOpen(false);
    };

    const handleCategoryToggle = (id) => {
        dispatch(toggleSelectedCategory(id));
    };

    return (
        <div className={`
            bg-white z-30 transition-all duration-300
            sm:rounded-lg rounded-none sm:shadow-md
            max-sm:pt-0 sm:p-4 p-2 m-0 max-sm:border-t-0
            border border-[#E0E0E0]
            sticky ${isHeaderClose ? 'top-2' : 'top-20'}
        `}>
            {/* Search Input Row */}
            <div className="rounded-md flex items-center p-2 border border-[#0000001f] bg-gray-50 mb-3">
                <span className="text-[#4b5259] px-2 shrink-0">
                    <IconSearch3 size="20"/>
                </span>
                <input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400 min-w-0 mx-2"
                    type="search"
                    placeholder={t('carSearch')}
                />

                <div className="flex items-center gap-2 text-[#75736F] border-r pr-2 mr-2 border-gray-300 shrink-0">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsSortOpen(!isSortOpen)}
                            className="flex items-center gap-1 hover:bg-gray-200 p-1.5 rounded transition-colors whitespace-nowrap"
                        >
                            <IconSort size="20"/>
                            <span className="hidden sm:block text-xs font-bold text-nowrap">
                                {searchOrder ? t(searchOrder) : t('sort')}
                            </span>
                        </button>

                        {isSortOpen && (
                            <div ref={sortRef} className="absolute top-full left-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                <div onClick={() => handleSortChange('price_min')} className="px-4 py-2 hover:bg-blue-50 text-xs cursor-pointer text-gray-700 border-b">{t('price_min')}</div>
                                <div onClick={() => handleSortChange('price_max')} className="px-4 py-2 hover:bg-blue-50 text-xs cursor-pointer text-gray-700 border-b">{t('price_max')}</div>
                                <div onClick={() => handleSortChange('new')} className="px-4 py-2 hover:bg-blue-50 text-xs cursor-pointer text-gray-700">{t('sort1')}</div>
                            </div>
                        )}
                    </div>

                    <button onClick={() => dispatch(changeFilterStatus(true))} className="flex items-center gap-1 hover:bg-gray-200 p-1.5 rounded transition-colors whitespace-nowrap">
                        <IconFilter size="20"/>
                        <span className="hidden sm:block text-xs font-bold text-nowrap">{t('filters')}</span>
                    </button>
                </div>
            </div>

            {/* Categories */}
            <div className="w-full overflow-x-auto hide-scrollbar pb-1">
                <div className="flex gap-2">
                    {sortList.map((item) => {
                        const isSelected = selectedCategories.includes(item.id);
                        return (
                            <div
                                key={item.id}
                                onClick={() => handleCategoryToggle(item.id)}
                                className={`
                                    flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs cursor-pointer whitespace-nowrap transition-all select-none
                                    ${isSelected ? 'bg-blue-50 border-blue-500 text-blue-600 font-bold' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}
                                `}
                            >
                                {item.icon}
                                {t(item.title)}
                                {isSelected && <IconClose className="size-3 text-blue-500" />}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Disable Overlay */}
            {searchDisable && (
                <div className="absolute inset-0 bg-white/60 z-40 cursor-wait"></div>
            )}
        </div>
    );
}

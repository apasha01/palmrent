import Image from "next/image";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";

type BranchItem = {
  id: number;
  slug: string;
  title: string;
};

type BranchListProps = {
  branches?: BranchItem[];
  isLoading?: boolean;
};

const BranchList = ({ branches, isLoading }: BranchListProps) => {
  return (
    <div className="w-full px-2 md:px-0 mt-6 md:mt-2">
      <p className="font-bold text-2xl">شهر های اجاره خودرو</p>
      <p className="mt-2 text-sm">
        بهترین شهر ها برای اجاره خودرو و تجربه سفری راحت, سریع و بدون ودیعه
      </p>

      <div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
        {isLoading
          ? Array.from({ length: 10 }).map((_, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="relative w-[80px] h-[80px] sm:w-[100px] sm:h-[100px]">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
                <Skeleton className="h-4 w-14" />
              </div>
            ))
          : (branches ?? []).map((item) => (
              <div key={item.id} className="flex flex-col items-center gap-2">
                <Link href={`/cars-rent/${item.slug}`}>
                <div className="relative w-[80px] h-[80px] sm:w-[100px] sm:h-[100px]">
                  <Image
                    src={`/images/about-ser-2.png`}
                    alt={item.title}
                    fill
                    className="rounded-lg object-cover"
                  />
                </div>

                <p className="text-center mt-2">{item.title}</p>
                </Link>
              </div>
            ))}
      </div>
    </div>
  );
};

export default BranchList;

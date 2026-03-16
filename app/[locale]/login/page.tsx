import LoginDialog from "@/components/auth/login-dialog";

export const metadata = {
  title: "",
  description:
    "اجاره خودرو در دبی، استانبول و عمان بدون دپوزیت!  رزرو آسان، پرداخت ریالی، بیمه رایگان و تحویل در محل. بهترین قیمت و پشتیبانی ۲۴/۷.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function LoginPage() {
  return (
    <LoginDialog
      open
      hideTrigger
      showCloseButton={false}
      closeOnOutsideClick={false}
    />
  );
}
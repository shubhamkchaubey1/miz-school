import {
  LuHouse, LuBuilding2, LuReceipt, LuTag, LuGlobe, LuUsers, LuIdCard, LuLayers, LuCircleCheck, LuCalendarDays,
  LuBookOpen, LuAward, LuWallet, LuMegaphone, LuPlane, LuBus, LuRoute, LuConciergeBell, LuBedDouble, LuCoffee,
  LuQrCode, LuChartColumn, LuShieldCheck, LuSettings, LuBell, LuSearch, LuMenu, LuChevronDown, LuChevronRight,
  LuLogOut, LuPlus, LuDownload, LuPrinter, LuPhone, LuMail, LuMapPin, LuClock, LuX, LuCheck, LuArrowRight,
  LuTriangleAlert, LuIndianRupee, LuUserCheck, LuUserX, LuFilter, LuPencil, LuSend, LuPlay, LuCircleStop,
  LuNavigation, LuPackage, LuMessageSquare, LuPhoneCall, LuSchool, LuGraduationCap, LuFileText, LuUpload, LuEye,
  LuShoppingCart, LuMinus, LuTrendingUp, LuRefreshCw, LuLock, LuSmartphone, LuHeartPulse, LuBriefcase, LuScanLine,
  LuDoorOpen, LuInbox,
} from 'react-icons/lu';

const MAP = {
  home: LuHouse, building: LuBuilding2, receipt: LuReceipt, tag: LuTag, globe: LuGlobe, users: LuUsers, id: LuIdCard,
  layers: LuLayers, check: LuCircleCheck, calendar: LuCalendarDays, book: LuBookOpen, award: LuAward, wallet: LuWallet,
  megaphone: LuMegaphone, plane: LuPlane, bus: LuBus, route: LuRoute, desk: LuConciergeBell, bed: LuBedDouble,
  coffee: LuCoffee, qr: LuQrCode, chart: LuChartColumn, shield: LuShieldCheck, settings: LuSettings, bell: LuBell,
  search: LuSearch, menu: LuMenu, down: LuChevronDown, right: LuChevronRight, logout: LuLogOut, plus: LuPlus,
  download: LuDownload, print: LuPrinter, phone: LuPhone, mail: LuMail, pin: LuMapPin, clock: LuClock, x: LuX,
  tick: LuCheck, arrow: LuArrowRight, alert: LuTriangleAlert, rupee: LuIndianRupee, 'user-check': LuUserCheck,
  'user-x': LuUserX, filter: LuFilter, edit: LuPencil, send: LuSend, play: LuPlay, stop: LuCircleStop, nav: LuNavigation,
  package: LuPackage, message: LuMessageSquare, call: LuPhoneCall, school: LuSchool, cap: LuGraduationCap,
  file: LuFileText, upload: LuUpload, eye: LuEye, cart: LuShoppingCart, minus: LuMinus, trend: LuTrendingUp,
  refresh: LuRefreshCw, lock: LuLock, phone2: LuSmartphone, health: LuHeartPulse, briefcase: LuBriefcase,
  scan: LuScanLine, door: LuDoorOpen, inbox: LuInbox,
};

export default function Icon({ name, size = 18, ...rest }) {
  const C = MAP[name] || LuFileText;
  return <C size={size} aria-hidden="true" {...rest} />;
}

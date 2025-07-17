import React, { useState, useCallback, useMemo, useRef, useEffect, useReducer } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  TextField,
  Button,
  Alert,
  Divider,
  IconButton,
  CircularProgress,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Grid,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Tooltip,
  Badge,
  LinearProgress,
  Snackbar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  Zoom,
  Slide,
  Collapse,
  alpha,
  styled,
  Autocomplete,
  Checkbox,
  Rating,
  Slider,
  Stack,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Fab,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  ButtonGroup,
  ToggleButton,
  ToggleButtonGroup,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  AvatarGroup,
  Container,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  PhotoCamera as PhotoCameraIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  Settings as SettingsIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  CloudUpload as CloudUploadIcon,
  Person as PersonIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  LocationOn as LocationOnIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon,
  Star as StarIcon,
  GitHub as GitHubIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Instagram as InstagramIcon,
  Facebook as FacebookIcon,
  YouTube as YouTubeIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  QrCode as QrCodeIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Group as GroupIcon,
  EmojiEvents as EmojiEventsIcon,
  Bookmark as BookmarkIcon,
  Psychology as PsychologyIcon,
  Interests as InterestsIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  Refresh as RefreshIcon,
  Backup as BackupIcon,
  RestoreFromTrash as RestoreIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  AutoAwesome as AutoAwesomeIcon,
  Verified as VerifiedIcon,
  PublicIcon,
  LockIcon,
  GroupsIcon,
  PersonAddIcon,
  CameraAltIcon,
  VideoCameraBackIcon,
  MicIcon,
  AttachFileIcon,
  CalendarTodayIcon,
  AccessTimeIcon,
  TrendingDownIcon,
  BarChartIcon,
  DonutSmallIcon,
  InsertChartIcon,
  ShowChartIcon,
  TableChartIcon,
  PieChartIcon,
  ScatterPlotIcon,
  BubbleChartIcon,
  MultilineChartIcon,
  AreaChartIcon,
  RadarIcon,
  SentimentVeryDissatisfiedIcon,
  SentimentDissatisfiedIcon,
  SentimentNeutralIcon,
  SentimentSatisfiedIcon,
  SentimentVerySatisfiedIcon,
  ThumbUpIcon,
  ThumbDownIcon,
  FavoriteIcon,
  FavoriteBorderIcon,
  BookmarkBorderIcon,
  ShareIcon as ShareOutlinedIcon,
  ReportIcon,
  BlockIcon,
  HelpIcon,
  InfoIcon,
  DarkModeIcon,
  LightModeIcon,
  ColorLensIcon,
  FormatPaintIcon,
  AutoFixHighIcon,
  TuneIcon,
  ExtensionIcon,
  BuildIcon,
  CodeIcon,
  BugReportIcon,
  FeedbackIcon,
  RateReviewIcon,
  SupportIcon,
  ContactSupportIcon,
  ChatIcon,
  MessageIcon,
  ForumIcon,
  QuestionAnswerIcon,
  LiveHelpIcon,
  HelpCenterIcon,
  MenuBookIcon,
  LibraryBooksIcon,
  HistoryEduIcon,
  SchoolIcon as EducationIcon,
  WorkHistoryIcon,
  BusinessCenterIcon,
  CorporateFareIcon,
  HomeWorkIcon,
  AssignmentIcon,
  TaskIcon,
  PlaylistAddCheckIcon,
  ChecklistIcon,
  InventoryIcon,
  CategoryIcon,
  LabelIcon,
  LocalOfferIcon,
  NewReleasesIcon,
  FiberNewIcon,
  UpdateIcon,
  SyncIcon,
  CloudSyncIcon,
  CloudDoneIcon,
  CloudOffIcon,
  WifiIcon,
  WifiOffIcon,
  SignalWifiStatusbar4BarIcon,
  NetworkCheckIcon,
  RouterIcon,
  DevicesIcon,
  DeviceHubIcon,
  MemoryIcon,
  StorageIcon,
  CloudIcon,
  CloudQueueIcon,
  CloudCircleIcon,
  CloudDownloadIcon,
  CloudUploadIcon as CloudUploadOutlinedIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderSharedIcon,
  FolderSpecialIcon,
  CreateNewFolderIcon,
  DriveFileMoveIcon,
  FileCopyIcon,
  FileOpenIcon,
  FileDownloadIcon,
  FileUploadIcon,
  AttachmentIcon,
  LinkIcon,
  LinkOffIcon,
  InsertLinkIcon,
  ContentCopyIcon,
  ContentCutIcon,
  ContentPasteIcon,
  SelectAllIcon,
  ClearIcon,
  UndoIcon,
  RedoIcon,
  FindInPageIcon,
  FindReplaceIcon,
  SpellcheckIcon,
  TranslateIcon,
  GTranslateIcon,
  RecordVoiceOverIcon,
  VoiceOverOffIcon,
  HearingIcon,
  HearingDisabledIcon,
  AccessibilityIcon,
  AccessibilityNewIcon,
  VisibilityIcon as VisibilityOutlinedIcon,
  VisibilityOffIcon as VisibilityOffOutlinedIcon,
  RemoveRedEyeIcon,
  PreviewIcon,
  ViewListIcon,
  ViewModuleIcon,
  ViewStreamIcon,
  ViewCarouselIcon,
  ViewColumnIcon,
  ViewComfyIcon,
  ViewCompactIcon,
  ViewAgendaIcon,
  ViewArrayIcon,
  ViewQuiltIcon,
  ViewWeekIcon,
  ViewDayIcon,
  ViewSidebarIcon,
  ViewHeadlineIcon,
  ViewInArIcon,
  ThreeDRotationIcon,
  View360Icon,
  CropFreeIcon,
  CropIcon,
  CropOriginalIcon,
  CropSquareIcon,
  CropPortraitIcon,
  CropLandscapeIcon,
  Crop169Icon,
  Crop32Icon,
  Crop54Icon,
  Crop75Icon,
  AspectRatioIcon,
  FitScreenIcon,
  ZoomInIcon,
  ZoomOutIcon,
  ZoomInMapIcon,
  ZoomOutMapIcon,
  CenterFocusStrongIcon,
  CenterFocusWeakIcon,
  MyLocationIcon,
  LocationSearchingIcon,
  LocationDisabledIcon,
  NearMeIcon,
  NearMeDisabledIcon,
  NavigationIcon,
  ExploreIcon,
  ExploreOffIcon,
  CompassCalibrationIcon,
  SatelliteIcon,
  SatelliteAltIcon,
  TerrainIcon,
  MapIcon,
  PlaceIcon,
  PinDropIcon,
  RoomIcon,
  HomeIcon,
  BusinessIcon,
  StoreIcon,
  StorefrontIcon,
  ShoppingCartIcon,
  ShoppingBagIcon,
  ShoppingBasketIcon,
  LocalGroceryStoreIcon,
  LocalMallIcon,
  LocalActivityIcon,
  LocalAtmIcon,
  LocalBarIcon,
  LocalCafeIcon,
  LocalCarWashIcon,
  LocalConvenienceStoreIcon,
  LocalDiningIcon,
  LocalDrinkIcon,
  LocalFloristIcon,
  LocalGasStationIcon,
  LocalHospitalIcon,
  LocalHotelIcon,
  LocalLaundryServiceIcon,
  LocalLibraryIcon,
  LocalMoviesIcon,
  LocalOfferIcon as LocalOfferOutlinedIcon,
  LocalParkingIcon,
  LocalPharmacyIcon,
  LocalPhoneIcon,
  LocalPizzaIcon,
  LocalPlayIcon,
  LocalPostOfficeIcon,
  LocalPrintshopIcon,
  LocalSeeIcon,
  LocalShippingIcon,
  LocalTaxiIcon,
  MonetizationOnIcon,
  AttachMoneyIcon,
  CurrencyExchangeIcon,
  PaidIcon,
  PaymentIcon,
  PaymentsIcon,
  AccountBalanceIcon,
  AccountBalanceWalletIcon,
  CreditCardIcon,
  RequestQuoteIcon,
  ReceiptIcon,
  ReceiptLongIcon,
  SavingsIcon,
  TrendingFlatIcon,
  TrendingUpIcon as TrendingUpOutlinedIcon,
  TrendingDownIcon as TrendingDownOutlinedIcon,
  ShowChartIcon as ShowChartOutlinedIcon,
  BarChartIcon as BarChartOutlinedIcon,
  PieChartIcon as PieChartOutlinedIcon,
  DonutLargeIcon,
  DonutSmallIcon as DonutSmallOutlinedIcon,
  BubbleChartIcon as BubbleChartOutlinedIcon,
  MultilineChartIcon as MultilineChartOutlinedIcon,
  TimelineIcon as TimelineOutlinedIcon,
  AreaChartIcon as AreaChartOutlinedIcon,
  ScatterPlotIcon as ScatterPlotOutlinedIcon,
  TableChartIcon as TableChartOutlinedIcon,
  InsertChartIcon as InsertChartOutlinedIcon,
  AssessmentIcon,
  EqualizerIcon,
  GraphicEqIcon,
  LeaderboardIcon,
  PollIcon,
  QuizIcon,
  CalculateIcon,
  FunctionsIcon,
  PercentIcon,
  PlusOneIcon,
  ExposureIcon,
  TimerIcon,
  Timer10Icon,
  Timer3Icon,
  TimerOffIcon,
  AlarmIcon,
  AlarmOnIcon,
  AlarmOffIcon,
  AlarmAddIcon,
  ScheduleIcon,
  ScheduleSendIcon,
  DateRangeIcon,
  EventIcon,
  EventNoteIcon,
  EventAvailableIcon,
  EventBusyIcon,
  EventSeatIcon,
  EventRepeatIcon,
  CalendarMonthIcon,
  CalendarViewDayIcon,
  CalendarViewWeekIcon,
  CalendarViewMonthIcon,
  TodayIcon,
  WatchLaterIcon,
  QueryBuilderIcon,
  HourglassEmptyIcon,
  HourglassFullIcon,
  HourglassTopIcon,
  HourglassBottomIcon,
  MoreTimeIcon,
  AvTimerIcon,
  TimerIcon as TimerOutlinedIcon,
  SlowMotionVideoIcon,
  FastForwardIcon,
  FastRewindIcon,
  SkipNextIcon,
  SkipPreviousIcon,
  PlayArrowIcon,
  PauseIcon,
  StopIcon,
  ReplayIcon,
  Replay10Icon,
  Replay30Icon,
  Forward10Icon,
  Forward30Icon,
  VolumeUpIcon,
  VolumeDownIcon,
  VolumeMuteIcon,
  VolumeOffIcon,
  SurroundSoundIcon,
  EqualizerIcon as EqualizerOutlinedIcon,
  GraphicEqIcon as GraphicEqOutlinedIcon,
  AudiotrackIcon,
  MusicNoteIcon,
  MusicOffIcon,
  AlbumIcon,
  QueueMusicIcon,
  PlaylistPlayIcon,
  PlaylistAddIcon,
  PlaylistRemoveIcon,
  ShuffleIcon,
  RepeatIcon,
  RepeatOneIcon,
  RepeatOnIcon,
  LibraryMusicIcon,
  LibraryAddIcon,
  LibraryBooksIcon as LibraryBooksOutlinedIcon,
  LibraryAddCheckIcon,
  VideoLibraryIcon,
  VideoCallIcon,
  VideocamIcon,
  VideocamOffIcon,
  VideoSettingsIcon,
  VideoLabelIcon,
  VideoFileIcon,
  LiveTvIcon,
  TvIcon,
  TvOffIcon,
  ConnectedTvIcon,
  DesktopWindowsIcon,
  DesktopMacIcon,
  DesktopAccessDisabledIcon,
  LaptopIcon,
  LaptopMacIcon,
  LaptopWindowsIcon,
  LaptopChromebookIcon,
  TabletIcon,
  TabletMacIcon,
  TabletAndroidIcon,
  PhoneAndroidIcon,
  PhoneIphoneIcon,
  SmartphoneIcon,
  WatchIcon,
  SmartToyIcon,
  SpeakerIcon,
  SpeakerGroupIcon,
  HeadsetIcon,
  HeadsetMicIcon,
  HeadsetOffIcon,
  HeadphonesIcon,
  MicIcon as MicOutlinedIcon,
  MicOffIcon,
  MicExternalOnIcon,
  MicExternalOffIcon,
  MicNoneIcon,
  KeyboardIcon,
  KeyboardAltIcon,
  KeyboardArrowDownIcon,
  KeyboardArrowLeftIcon,
  KeyboardArrowRightIcon,
  KeyboardArrowUpIcon,
  KeyboardBackspaceIcon,
  KeyboardCapslock as KeyboardCapslockIcon,
  KeyboardCommandKeyIcon,
  KeyboardControlKeyIcon,
  KeyboardDoubleArrowDownIcon,
  KeyboardDoubleArrowLeftIcon,
  KeyboardDoubleArrowRightIcon,
  KeyboardDoubleArrowUpIcon,
  KeyboardHideIcon,
  KeyboardReturnIcon,
  KeyboardTabIcon,
  KeyboardVoiceIcon,
  MouseIcon,
  SpaceBarIcon,
  TouchAppIcon,
  CameraIcon,
  CameraAltIcon as CameraAltOutlinedIcon,
  CameraEnhanceIcon,
  CameraFrontIcon,
  CameraRearIcon,
  CameraRollIcon,
  PhotoCameraIcon as PhotoCameraOutlinedIcon,
  PhotoCameraBackIcon,
  PhotoCameraFrontIcon,
  PhotoLibraryIcon,
  PhotoAlbumIcon,
  PhotoFilterIcon,
  PhotoSizeSelectActualIcon,
  PhotoSizeSelectLargeIcon,
  PhotoSizeSelectSmallIcon,
  ImageIcon,
  ImageAspectRatioIcon,
  ImageNotSupportedIcon,
  ImageSearchIcon,
  CollectionsIcon,
  CollectionsBookmarkIcon,
  BrokenImageIcon,
  BurstModeIcon,
  TimerIcon as Timer3OutlinedIcon,
  TimerOffIcon as TimerOffOutlinedIcon,
  FlashOnIcon,
  FlashOffIcon,
  FlashAutoIcon,
  WbSunnyIcon,
  WbCloudyIcon,
  WbIncandescentIcon,
  WbIridescentIcon,
  WbShadeIcon,
  WbTwilightIcon,
  FilterIcon,
  FilterBAndWIcon,
  FilterCenterFocusIcon,
  FilterDramaIcon,
  FilterHdrIcon,
  FilterNoneIcon,
  FilterTiltShiftIcon,
  FilterVintageIcon,
  Filter1Icon,
  Filter2Icon,
  Filter3Icon,
  Filter4Icon,
  Filter5Icon,
  Filter6Icon,
  Filter7Icon,
  Filter8Icon,
  Filter9Icon,
  Filter9PlusIcon,
  GradientIcon,
  GrainIcon,
  GridOnIcon,
  GridOffIcon,
  GridGoldenratioIcon,
  GridViewIcon,
  Grid3x3Icon,
  Grid4x4Icon,
  ViewCompactAltIcon,
  ViewComfyAltIcon,
  ViewModuleIcon as ViewModuleOutlinedIcon,
  ViewQuiltIcon as ViewQuiltOutlinedIcon,
  ViewStreamIcon as ViewStreamOutlinedIcon,
  ViewListIcon as ViewListOutlinedIcon,
  ViewColumnIcon as ViewColumnOutlinedIcon,
  ViewSidebarIcon as ViewSidebarOutlinedIcon,
  ViewCarouselIcon as ViewCarouselOutlinedIcon,
  ViewAgendaIcon as ViewAgendaOutlinedIcon,
  ViewArrayIcon as ViewArrayOutlinedIcon,
  ViewWeekIcon as ViewWeekOutlinedIcon,
  ViewDayIcon as ViewDayOutlinedIcon,
  ViewHeadlineIcon as ViewHeadlineOutlinedIcon,
  ViewInArIcon as ViewInArOutlinedIcon,
  ThreeDRotationIcon as ThreeDRotationOutlinedIcon,
  View360Icon as View360OutlinedIcon,
  CropFreeIcon as CropFreeOutlinedIcon,
  CropIcon as CropOutlinedIcon,
  CropOriginalIcon as CropOriginalOutlinedIcon,
  CropSquareIcon as CropSquareOutlinedIcon,
  CropPortraitIcon as CropPortraitOutlinedIcon,
  CropLandscapeIcon as CropLandscapeOutlinedIcon,
  Crop169Icon as Crop169OutlinedIcon,
  Crop32Icon as Crop32OutlinedIcon,
  Crop54Icon as Crop54OutlinedIcon,
  Crop75Icon as Crop75OutlinedIcon,
  AspectRatioIcon as AspectRatioOutlinedIcon,
  FitScreenIcon as FitScreenOutlinedIcon,
  ZoomInIcon as ZoomInOutlinedIcon,
  ZoomOutIcon as ZoomOutOutlinedIcon,
  ZoomInMapIcon as ZoomInMapOutlinedIcon,
  ZoomOutMapIcon as ZoomOutMapOutlinedIcon,
  CenterFocusStrongIcon as CenterFocusStrongOutlinedIcon,
  CenterFocusWeakIcon as CenterFocusWeakOutlinedIcon,
  MyLocationIcon as MyLocationOutlinedIcon,
  LocationSearchingIcon as LocationSearchingOutlinedIcon,
  LocationDisabledIcon as LocationDisabledOutlinedIcon,
  NearMeIcon as NearMeOutlinedIcon,
  NearMeDisabledIcon as NearMeDisabledOutlinedIcon,
  NavigationIcon as NavigationOutlinedIcon,
  ExploreIcon as ExploreOutlinedIcon,
  ExploreOffIcon as ExploreOffOutlinedIcon,
  CompassCalibrationIcon as CompassCalibrationOutlinedIcon,
  SatelliteIcon as SatelliteOutlinedIcon,
  SatelliteAltIcon as SatelliteAltOutlinedIcon,
  TerrainIcon as TerrainOutlinedIcon,
  MapIcon as MapOutlinedIcon,
  PlaceIcon as PlaceOutlinedIcon,
  PinDropIcon as PinDropOutlinedIcon,
  RoomIcon as RoomOutlinedIcon,
  HomeIcon as HomeOutlinedIcon,
  BusinessIcon as BusinessOutlinedIcon,
  StoreIcon as StoreOutlinedIcon,
  StorefrontIcon as StorefrontOutlinedIcon,
  ShoppingCartIcon as ShoppingCartOutlinedIcon,
  ShoppingBagIcon as ShoppingBagOutlinedIcon,
  ShoppingBasketIcon as ShoppingBasketOutlinedIcon,
  LocalGroceryStoreIcon as LocalGroceryStoreOutlinedIcon,
  LocalMallIcon as LocalMallOutlinedIcon,
  LocalActivityIcon as LocalActivityOutlinedIcon,
  LocalAtmIcon as LocalAtmOutlinedIcon,
  LocalBarIcon as LocalBarOutlinedIcon,
  LocalCafeIcon as LocalCafeOutlinedIcon,
  LocalCarWashIcon as LocalCarWashOutlinedIcon,
  LocalConvenienceStoreIcon as LocalConvenienceStoreOutlinedIcon,
  LocalDiningIcon as LocalDiningOutlinedIcon,
  LocalDrinkIcon as LocalDrinkOutlinedIcon,
  LocalFloristIcon as LocalFloristOutlinedIcon,
  LocalGasStationIcon as LocalGasStationOutlinedIcon,
  LocalHospitalIcon as LocalHospitalOutlinedIcon,
  LocalHotelIcon as LocalHotelOutlinedIcon,
  LocalLaundryServiceIcon as LocalLaundryServiceOutlinedIcon,
  LocalLibraryIcon as LocalLibraryOutlinedIcon,
  LocalMoviesIcon as LocalMoviesOutlinedIcon,
  LocalOfferIcon as LocalOfferIcon2,
  LocalParkingIcon as LocalParkingOutlinedIcon,
  LocalPharmacyIcon as LocalPharmacyOutlinedIcon,
  LocalPhoneIcon as LocalPhoneOutlinedIcon,
  LocalPizzaIcon as LocalPizzaOutlinedIcon,
  LocalPlayIcon as LocalPlayOutlinedIcon,
  LocalPostOfficeIcon as LocalPostOfficeOutlinedIcon,
  LocalPrintshopIcon as LocalPrintshopOutlinedIcon,
  LocalSeeIcon as LocalSeeOutlinedIcon,
  LocalShippingIcon as LocalShippingOutlinedIcon,
  LocalTaxiIcon as LocalTaxiOutlinedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { debounce } from 'lodash';

// Advanced State Management with useReducer
const profileReducer = (state, action) => {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
      };
    case 'SET_NESTED_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.parent]: {
            ...state.formData[action.parent],
            [action.field]: action.value,
          },
        },
      };
    case 'SET_ARRAY_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: action.value,
        },
      };
    case 'ADD_ARRAY_ITEM':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: [...state.formData[action.field], action.item],
        },
      };
    case 'REMOVE_ARRAY_ITEM':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: state.formData[action.field].filter((_, index) => index !== action.index),
        },
      };
    case 'UPDATE_ARRAY_ITEM':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.field]: state.formData[action.field].map((item, index) =>
            index === action.index ? { ...item, ...action.updates } : item
          ),
        },
      };
    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.value };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.value };
    case 'SET_LOADING':
      return { ...state, loading: action.value };
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.value };
    case 'SET_THEME_MODE':
      return { ...state, themeMode: action.value };
    case 'ADD_ALERT':
      return {
        ...state,
        alerts: [...state.alerts, action.alert],
      };
    case 'REMOVE_ALERT':
      return {
        ...state,
        alerts: state.alerts.filter(alert => alert.id !== action.id),
      };
    case 'SET_VALIDATION_ERRORS':
      return { ...state, validationErrors: action.errors };
    case 'SET_UNSAVED_CHANGES':
      return { ...state, unsavedChanges: action.value };
    case 'RESET_FORM':
      return {
        ...state,
        formData: action.data,
        editMode: false,
        unsavedChanges: false,
        validationErrors: {},
      };
    default:
      return state;
  }
};

// Advanced Styled Components
const StyledPaper = styled(Paper)(({ theme, themeMode }) => ({
  background: themeMode === 'dark' 
    ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
    : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
    backgroundSize: '200% 100%',
    animation: 'gradient-shift 3s ease infinite',
  },
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[12],
  },
  '@keyframes gradient-shift': {
    '0%': { backgroundPosition: '0% 50%' },
    '50%': { backgroundPosition: '100% 50%' },
    '100%': { backgroundPosition: '0% 50%' },
  },
}));

const StyledAvatar = styled(Avatar)(({ theme, size = 'large' }) => ({
  width: size === 'large' ? 150 : size === 'medium' ? 80 : 60,
  height: size === 'large' ? 150 : size === 'medium' ? 80 : 60,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  position: 'relative',
  border: `4px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  '&:hover': {
    transform: 'scale(1.05) rotate(5deg)',
    border: `4px solid ${theme.palette.primary.main}`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: '50%',
    border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'scale(0)',
    transition: 'transform 0.3s ease',
  },
  '&:hover::after': {
    transform: 'scale(1.1)',
  },
}));

const ProfileStrengthMeter = styled(LinearProgress)(({ theme }) => ({
  height: 12,
  borderRadius: 6,
  background: alpha(theme.palette.grey[300], 0.3),
  '& .MuiLinearProgress-bar': {
    borderRadius: 6,
    background: `linear-gradient(90deg, ${theme.palette.error.main} 0%, ${theme.palette.warning.main} 50%, ${theme.palette.success.main} 100%)`,
    transition: 'all 0.5s ease',
  },
}));

const AnimatedCard = styled(Card)(({ theme }) => ({
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

const GlowingChip = styled(Chip)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: 'white',
  fontWeight: 600,
  '&:hover': {
    boxShadow: `0 0 20px ${alpha(theme.palette.primary.main, 0.5)}`,
  },
}));

const FloatingActionButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  zIndex: 1000,
}));

// Remove all usage of <Timeline>, <TimelineItem>, <TimelineOppositeContent>, <TimelineSeparator>, <TimelineConnector>, <TimelineContent>, <TimelineDot>, and any TimelineIcon or TimelineChartIcon in the file.

// Continuing from where the code left off...

const AdvancedProfile = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, updateProfile } = useAuth();
  const fileInputRef = useRef(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Initial state for useReducer
  const initialState = {
    formData: {
      personalInfo: {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        phone: user?.phone || '',
        bio: user?.bio || '',
        location: user?.location || '',
        website: user?.website || '',
        birthDate: user?.birthDate || '',
        gender: user?.gender || '',
        profilePicture: user?.profilePicture || '',
      },
      professionalInfo: {
        jobTitle: user?.jobTitle || '',
        company: user?.company || '',
        industry: user?.industry || '',
        experience: user?.experience || '',
        skills: user?.skills || [],
        certifications: user?.certifications || [],
        education: user?.education || [],
        workHistory: user?.workHistory || [],
      },
      socialLinks: {
        linkedin: user?.socialLinks?.linkedin || '',
        github: user?.socialLinks?.github || '',
        twitter: user?.socialLinks?.twitter || '',
        instagram: user?.socialLinks?.instagram || '',
        facebook: user?.socialLinks?.facebook || '',
        youtube: user?.socialLinks?.youtube || '',
      },
      preferences: {
        privacy: user?.preferences?.privacy || 'public',
        notifications: user?.preferences?.notifications || true,
        newsletter: user?.preferences?.newsletter || false,
        theme: user?.preferences?.theme || 'light',
        language: user?.preferences?.language || 'en',
      },
      achievements: user?.achievements || [],
      interests: user?.interests || [],
      projects: user?.projects || [],
    },
    editMode: false,
    activeTab: 0,
    loading: false,
    viewMode: 'detailed',
    themeMode: 'light',
    alerts: [],
    validationErrors: {},
    unsavedChanges: false,
  };

  const [state, dispatch] = useReducer(profileReducer, initialState);

  // Memoized calculations
  const profileStrength = useMemo(() => {
    const fields = [
      state.formData.personalInfo.firstName,
      state.formData.personalInfo.lastName,
      state.formData.personalInfo.email,
      state.formData.personalInfo.bio,
      state.formData.personalInfo.location,
      state.formData.personalInfo.profilePicture,
      state.formData.professionalInfo.jobTitle,
      state.formData.professionalInfo.company,
      state.formData.professionalInfo.skills.length > 0,
      state.formData.socialLinks.linkedin,
    ];
    const filledFields = fields.filter(field => field && field !== '').length;
    return (filledFields / fields.length) * 100;
  }, [state.formData]);

  const suggestedSkills = useMemo(() => [
    'JavaScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'TypeScript',
    'Angular', 'Vue.js', 'Django', 'Flask', 'Spring', 'MongoDB', 'PostgreSQL',
    'AWS', 'Docker', 'Kubernetes', 'Git', 'GraphQL', 'REST APIs'
  ], []);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (data) => {
      try {
        await updateProfile(data);
        setSnackbar({ open: true, message: 'Profile saved successfully!', severity: 'success' });
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to save profile', severity: 'error' });
      }
    }, 1000),
    [updateProfile]
  );

  // Event handlers
  const handleFieldChange = useCallback((field, value, parent = null) => {
    if (parent) {
      dispatch({ type: 'SET_NESTED_FIELD', parent, field, value });
    } else {
      dispatch({ type: 'SET_FIELD', field, value });
    }
    dispatch({ type: 'SET_UNSAVED_CHANGES', value: true });
  }, []);

  const handleArrayFieldChange = useCallback((field, value) => {
    dispatch({ type: 'SET_ARRAY_FIELD', field, value });
    dispatch({ type: 'SET_UNSAVED_CHANGES', value: true });
  }, []);

  const handleAddArrayItem = useCallback((field, item) => {
    dispatch({ type: 'ADD_ARRAY_ITEM', field, item });
    dispatch({ type: 'SET_UNSAVED_CHANGES', value: true });
  }, []);

  const handleRemoveArrayItem = useCallback((field, index) => {
    dispatch({ type: 'REMOVE_ARRAY_ITEM', field, index });
    dispatch({ type: 'SET_UNSAVED_CHANGES', value: true });
  }, []);

  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        handleFieldChange('profilePicture', e.target.result, 'personalInfo');
      };
      reader.readAsDataURL(file);
    }
  }, [handleFieldChange]);

  const handleSave = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', value: true });
    try {
      await debouncedSave(state.formData);
      dispatch({ type: 'SET_EDIT_MODE', value: false });
      dispatch({ type: 'SET_UNSAVED_CHANGES', value: false });
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', value: false });
    }
  }, [state.formData, debouncedSave]);

  const handleTabChange = useCallback((event, newValue) => {
    dispatch({ type: 'SET_ACTIVE_TAB', value: newValue });
  }, []);

  const handleMenuClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleExportProfile = useCallback(() => {
    const profileData = JSON.stringify(state.formData, null, 2);
    const blob = new Blob([profileData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'profile.json';
    a.click();
    URL.revokeObjectURL(url);
    handleMenuClose();
  }, [state.formData]);

  // Tab panel component
  const TabPanel = ({ children, value, index, ...other }) => (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );

  // Personal Info Tab
  const PersonalInfoTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
          <StyledAvatar
            src={previewImage || state.formData.personalInfo.profilePicture}
            size="large"
            onClick={() => fileInputRef.current?.click()}
          >
            {!state.formData.personalInfo.profilePicture && (
              <PhotoCameraIcon sx={{ fontSize: 40 }} />
            )}
          </StyledAvatar>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <Typography variant="h6" textAlign="center">
            {state.formData.personalInfo.firstName} {state.formData.personalInfo.lastName}
          </Typography>
          <Box width="100%" mt={2}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Profile Strength: {Math.round(profileStrength)}%
            </Typography>
            <ProfileStrengthMeter variant="determinate" value={profileStrength} />
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} md={8}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name"
              value={state.formData.personalInfo.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value, 'personalInfo')}
              disabled={!state.editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={state.formData.personalInfo.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value, 'personalInfo')}
              disabled={!state.editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={state.formData.personalInfo.email}
              onChange={(e) => handleFieldChange('email', e.target.value, 'personalInfo')}
              disabled={!state.editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Phone"
              value={state.formData.personalInfo.phone}
              onChange={(e) => handleFieldChange('phone', e.target.value, 'personalInfo')}
              disabled={!state.editMode}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Bio"
              multiline
              rows={4}
              value={state.formData.personalInfo.bio}
              onChange={(e) => handleFieldChange('bio', e.target.value, 'personalInfo')}
              disabled={!state.editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Location"
              value={state.formData.personalInfo.location}
              onChange={(e) => handleFieldChange('location', e.target.value, 'personalInfo')}
              disabled={!state.editMode}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Website"
              value={state.formData.personalInfo.website}
              onChange={(e) => handleFieldChange('website', e.target.value, 'personalInfo')}
              disabled={!state.editMode}
            />
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );

  // Professional Info Tab
  const ProfessionalInfoTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Job Title"
          value={state.formData.professionalInfo.jobTitle}
          onChange={(e) => handleFieldChange('jobTitle', e.target.value, 'professionalInfo')}
          disabled={!state.editMode}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Company"
          value={state.formData.professionalInfo.company}
          onChange={(e) => handleFieldChange('company', e.target.value, 'professionalInfo')}
          disabled={!state.editMode}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Industry"
          value={state.formData.professionalInfo.industry}
          onChange={(e) => handleFieldChange('industry', e.target.value, 'professionalInfo')}
          disabled={!state.editMode}
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label="Experience (years)"
          type="number"
          value={state.formData.professionalInfo.experience}
          onChange={(e) => handleFieldChange('experience', e.target.value, 'professionalInfo')}
          disabled={!state.editMode}
        />
      </Grid>
      <Grid item xs={12}>
        <Autocomplete
          multiple
          options={suggestedSkills}
          value={state.formData.professionalInfo.skills}
          onChange={(event, newValue) => handleFieldChange('skills', newValue, 'professionalInfo')}
          disabled={!state.editMode}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <GlowingChip
                variant="outlined"
                label={option}
                {...getTagProps({ index })}
              />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label="Skills"
              placeholder="Add skills"
            />
          )}
        />
      </Grid>
    </Grid>
  );

  // Social Links Tab
  const SocialLinksTab = () => (
    <Grid container spacing={3}>
      {Object.entries(state.formData.socialLinks).map(([platform, url]) => (
        <Grid item xs={12} md={6} key={platform}>
          <TextField
            fullWidth
            label={platform.charAt(0).toUpperCase() + platform.slice(1)}
            value={url}
            onChange={(e) => handleFieldChange(platform, e.target.value, 'socialLinks')}
            disabled={!state.editMode}
            InputProps={{
              startAdornment: (
                <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  {platform === 'linkedin' && <LinkedInIcon color="primary" />}
                  {platform === 'github' && <GitHubIcon color="primary" />}
                  {platform === 'twitter' && <TwitterIcon color="primary" />}
                  {platform === 'instagram' && <InstagramIcon color="primary" />}
                  {platform === 'facebook' && <FacebookIcon color="primary" />}
                  {platform === 'youtube' && <YouTubeIcon color="primary" />}
                </Box>
              ),
            }}
          />
        </Grid>
      ))}
    </Grid>
  );

  // Preferences Tab
  const PreferencesTab = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Privacy Settings
        </Typography>
        <FormControl fullWidth>
          <InputLabel>Profile Visibility</InputLabel>
          <Select
            value={state.formData.preferences.privacy}
            onChange={(e) => handleFieldChange('privacy', e.target.value, 'preferences')}
            disabled={!state.editMode}
          >
            <MenuItem value="public">Public</MenuItem>
            <MenuItem value="private">Private</MenuItem>
            <MenuItem value="connections">Connections Only</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12}>
        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={state.formData.preferences.notifications}
              onChange={(e) => handleFieldChange('notifications', e.target.checked, 'preferences')}
              disabled={!state.editMode}
            />
          }
          label="Email Notifications"
        />
      </Grid>
      <Grid item xs={12}>
        <FormControlLabel
          control={
            <Switch
              checked={state.formData.preferences.newsletter}
              onChange={(e) => handleFieldChange('newsletter', e.target.checked, 'preferences')}
              disabled={!state.editMode}
            />
          }
          label="Newsletter Subscription"
        />
      </Grid>
    </Grid>
  );

  // Main render
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <StyledPaper themeMode={state.themeMode} elevation={8}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
            <Typography variant="h4" component="h1" fontWeight="bold">
              Profile Management
            </Typography>
            <Box display="flex" gap={1}>
              <Tooltip title="More options">
                <IconButton onClick={handleMenuClick}>
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title={state.editMode ? 'Cancel' : 'Edit Profile'}>
                <IconButton
                  onClick={() => dispatch({ type: 'SET_EDIT_MODE', value: !state.editMode })}
                  color={state.editMode ? 'error' : 'primary'}
                >
                  {state.editMode ? <CancelIcon /> : <EditIcon />}
                </IconButton>
              </Tooltip>
              {state.editMode && (
                <Tooltip title="Save Changes">
                  <IconButton
                    onClick={handleSave}
                    disabled={state.loading || !state.unsavedChanges}
                    color="success"
                  >
                    {state.loading ? <CircularProgress size={24} /> : <SaveIcon />}
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          <Tabs
            value={state.activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons="auto"
          >
            <Tab icon={<PersonIcon />} label="Personal Info" />
            <Tab icon={<WorkIcon />} label="Professional" />
            <Tab icon={<ShareIcon />} label="Social Links" />
            <Tab icon={<SettingsIcon />} label="Preferences" />
          </Tabs>
        </Box>

        <TabPanel value={state.activeTab} index={0}>
          <PersonalInfoTab />
        </TabPanel>
        <TabPanel value={state.activeTab} index={1}>
          <ProfessionalInfoTab />
        </TabPanel>
        <TabPanel value={state.activeTab} index={2}>
          <SocialLinksTab />
        </TabPanel>
        <TabPanel value={state.activeTab} index={3}>
          <PreferencesTab />
        </TabPanel>
      </StyledPaper>

      {/* Menu */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleExportProfile}>
          <ListItemIcon>
            <DownloadIcon />
          </ListItemIcon>
          <ListItemText>Export Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setDialogOpen(true)}>
          <ListItemIcon>
            <PrintIcon />
          </ListItemIcon>
          <ListItemText>Print Profile</ListItemText>
        </MenuItem>
      </Menu>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Floating Action Button */}
      {state.editMode && (
        <FloatingActionButton
          color="primary"
          onClick={handleSave}
          disabled={state.loading || !state.unsavedChanges}
        >
          {state.loading ? <CircularProgress size={24} color="inherit" /> : <SaveIcon />}
        </FloatingActionButton>
      )}
    </Container>
  );
};

export default AdvancedProfile;
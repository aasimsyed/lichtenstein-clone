import HomeCarousel from '../components/HomeCarousel';
import SelectionsCarousel from '../components/SelectionsCarousel';
import HomeSeriesGridClient from "@/components/HomeSeriesGridClient";

export default function Home() {
  return (
    <div id="homepage">
      <div id="mainBody" className="homepage">
        <HomeCarousel />
        <SelectionsCarousel />
        <HomeSeriesGridClient />
      </div>
    </div>
  );
}

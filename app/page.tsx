import HomeCarousel from '../components/HomeCarousel';
import SelectionsCarousel from '../components/SelectionsCarousel';

export default function Home() {
  return (
    <div id="homepage">
      <div id="mainBody" className="homepage">
        <HomeCarousel />
        <SelectionsCarousel />
      </div>
    </div>
  );
}

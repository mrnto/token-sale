import { truncateAddress } from "../utils/truncate-address";
import logo from "/logo.svg";

const Header = ({ account, connectWallet }) => (
    <nav className="w-full flex md:justify-center justify-between items-center p-4">
        <div className="md:flex-[0.5] flex-initial justify-center items-center">
            <span className="text-white	text-xl font-semibold">
                <img src={logo} alt="logo" className="inline w-16" />
                Super Token
            </span>
        </div>
        <div className="text-white md:flex flex-row justify-between items-center flex-initial">
            {!account ?
                <button onClick={connectWallet} className="bg-[#2952e3] py-2 px-7 mx-4 rounded-full cursor-pointer hover:bg-[#2546bd]">
                    Connect
                </button>
                :
                <p className="text-lg text-white py-1">
                    {truncateAddress(account)}
                </p>
            }
        </div>
    </nav>
);

export default Header;
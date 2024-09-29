import LandingPage from '../LandingPage';

function Root() {
    return (
        <div className="bg-slate-900 min-h-screen">
            <header>
                <nav className='bg-white border-gray-200 dark:bg-gray-900 p-3'>
                    <h1 className='self-center text-2xl font-semibold whitespace-nowrap dark:text-white'>One Night Werewolf</h1>
                </nav>
                <LandingPage />
            </header>
        </div>
    );
}

export default Root

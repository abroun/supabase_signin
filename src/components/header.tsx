
export interface HeaderProps {
    signedIn: boolean
    onSignOutClicked: () => void
}

export const Header = ({ signedIn, onSignOutClicked }: HeaderProps) => {
    return (<div className="header">
        {signedIn && <button onClick={onSignOutClicked}>Sign Out</button>}
    </div>)
}
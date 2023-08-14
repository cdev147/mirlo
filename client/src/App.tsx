import { css, injectGlobal } from "@emotion/css";
import LoadingSpinner from "components/common/LoadingSpinner";
import PageHeader from "components/common/PageHeader";
import Snackbar from "components/common/Snackbar";
import Player from "components/Player";
import React, { useContext, useState } from "react";
import { Helmet } from "react-helmet";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "services/api";
import { useGlobalStateContext } from "state/GlobalState";
import SnackbarContext from "state/SnackbarContext";
import useWidgetListener from "utils/useWidgetListener";
import Header from "./components/Header/Header";
import globalCSS from "./styles";
injectGlobal(globalCSS);

function App() {
  const { state, dispatch } = useGlobalStateContext();
  const { isDisplayed } = useContext(SnackbarContext);
  useWidgetListener();
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = state.user?.id;

  React.useEffect(() => {
    const callback = async () => {
      try {
        await api.post("refresh", {});
        const user = await api.get<LoggedInUser>("profile");
        dispatch({
          type: "setLoggedInUser",
          user: user.result,
        });
        setIsLoading(false);
      } catch (e) {
        if (e instanceof Error && e.message.includes("NetworkError")) {
          console.error(
            "Problem with the network, gonna just do nothing for now, we might want to throw up an error in the future"
          );
          setTimeout(callback, 1000 * 10);
        } else {
          setIsLoading(false);
          console.error("Error refreshing token", e);
          dispatch({
            type: "setLoggedInUser",
            user: undefined,
          });
          // if (
          //   !(
          //     location.pathname.includes("login") ||
          //     location.pathname.includes("signup")
          //   )
          // ) {
          //   navigate("/login");
          // }
        }
      }
    };

    callback();
    let interval: NodeJS.Timer | null = null;

    if (userId) {
      interval = setInterval(async () => {
        callback();
      }, 1000 * 60 * 5); // refresh every 5 minutes
    }
    return () => (interval ? clearInterval(interval) : undefined);
  }, [userId, dispatch, navigate, location.pathname]);

  // In the case of a widget we don't show all the wrapper stuff
  if (location.pathname.includes("widget")) {
    return <Outlet />;
  }

  const isArtistPage = location.pathname.includes("artist");

  return (
    <>
      <Helmet>
        <title>A Mirlo Space</title>
        <meta name="description" content="A home for all of your music" />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="A Mirlo Space" />
        <meta property="og:description" content="A home for all your music" />
        <meta property="og:image" content="/images/blackbird.png" />
      </Helmet>
      <div
        className={css`
          display: flex;
          flex-direction: column;
          min-height: 100%;
        `}
      >
        {isDisplayed && <Snackbar />}
        {isLoading && (
          <div
            className={css`
              display: flex;
              height: 100vh;
              justify-content: center;
              align-items: center;
              font-size: 4rem;
            `}
          >
            <LoadingSpinner />
          </div>
        )}
        {!isLoading && (
          <>
            <Header />
            <PageHeader />
            <div
              className={css`
                max-width: 640px;
                background-color: var(--mi-normal-background-color);
                padding: 2rem 2rem 9rem;
                margin: 0 auto;
                width: 100%;
                ${isArtistPage
                  ? `
                    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.1);
                    padding-top: .5rem;
                    `
                  : ""}
                border-radius: var(--mi-border-radius);

                @media screen and (max-width: 800px) {
                  padding: 1rem 1rem 9rem;
                }
              `}
            >
              <Outlet />
            </div>
            <div
              className={css`
                text-align: center;
                display: block;
              `}
            >
              Questions? <a href="mailto:mirlodotspace@proton.me">Contact us</a>
              .
            </div>
            <Player />
          </>
        )}
      </div>
    </>
  );
}

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import Clock from 'react-clock';
import 'react-clock/dist/Clock.css';
import { API } from '../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  Searchbar,
  ImageGallery,
  Modal,
  ImageGalleryItem,
  Button,
  Loader,
} from '.';

import css from './App.module.css';

const customOptions = {
  renderSecondHand: true,
  hourHandLength: 60,
  hourHandWidth: 7,
  minuteHandLength: 80,
  minuteHandWidth: 5,
  hourMarksLength: 15,
  hourMarksWidth: 3,
  minuteMarksLength: 7,
  minuteMarksWidth: 1,
};

const toastConfig = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
};

const status = {
  idle: 'idle',
  pending: 'pending',
  resolved: 'resolved',
  rejected: 'rejected',
};

export const App = () => {
  const [searchValue, setSearchValue] = useState('');
  const [modal, setModal] = useState(false);
  const [largeImg, setLargeImg] = useState('');
  const [pictures, setPictures] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(status.idle);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [loadMore, setLoadMore] = useState(false);
  const [value, setValue] = useState(new Date());

  const handleSearchValue = value => {
    setSearchValue(value);
    setPage(1);
    scrollToTop();
  };

  const hendleModalClose = () => {
    setModal(false);
  };

  const handlePictureClick = id => {
    const selectedPicture = pictures.find(picture => picture.id === id);
    if (selectedPicture) {
      setLargeImg(selectedPicture);
      setModal(true);
    }
  };

  const handleButtonMore = () => {
    setPage(prevStat => [prevStat + 1]);
  };

  const stateReset = () => {
    setModal(false);
    setLargeImg('');
    setPictures([]);
    setCurrentStatus(status.idle);
    setPage(1);
    setError('');
    setLoadMore(false);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const fetchImages = useCallback(async () => {
    setCurrentStatus(status.pending);
    if (searchValue === '') {
      setCurrentStatus(status.idle);
      return;
    }
    try {
      const data = await API(searchValue, page);
      const { hits: images, total } = data;
      const totalView = total > 200 ? 200 : total;

      if (images.length > 0 && page === 1) {
        toast.info(
          `Total images ${total} .You can view${totalView} .`,
          toastConfig
        );
      }

      if (images.length === 0) {
        toast.info('No images were found for your request.', toastConfig);
        stateReset();
        return;
      }

      setPictures(prevState =>
        page === 1 ? images : [...prevState, ...images]
      );
      setCurrentStatus(status.resolved);

      setLoadMore(page < Math.ceil(totalView / 12));
    } catch (error) {
      setCurrentStatus(status.rejected);
      setError(error.message);
    }
  }, [page, searchValue]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  useEffect(() => {
    const interval = setInterval(() => setValue(new Date()), 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className={css.App}>
      <Searchbar value={handleSearchValue} />
      {currentStatus === status.idle && (
        <div className={css.Img}>
          <Clock value={value} className={css.Clock} {...customOptions} />
          <h1 className={css.Title}>
            Here you will find everything <br /> you were looking for
          </h1>
        </div>
      )}
      {currentStatus === status.rejected && (
        <div>
          <p> Woops: {error}</p>
          {toast.error(`${error}. Please try again later.`, toastConfig)}
        </div>
      )}
      <ImageGallery onClick={handlePictureClick}>
        {pictures.map(({ tags, id, webformatURL }) => (
          <ImageGalleryItem
            key={id}
            webformatURL={webformatURL}
            tags={tags}
            id={id}
          />
        ))}
      </ImageGallery>
      {currentStatus === status.pending && <Loader />}
      {currentStatus === status.resolved && loadMore && (
        <Button nextPage={handleButtonMore} />
      )}
      {modal && <Modal largeImg={largeImg} onClose={hendleModalClose} />}
      <ToastContainer />
    </div>
  );
};

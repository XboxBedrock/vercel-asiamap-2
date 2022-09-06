import React, {useEffect, useState} from 'react';
import {Configure, connectAutoComplete, InstantSearch} from "react-instantsearch-dom";
import Autosuggest from "react-autosuggest";
import {useRouter} from "next/router";
import algoliasearch from "algoliasearch/lite";
import {AiOutlineUser, AiOutlineSearch} from "react-icons/ai";
import {openSpotlight} from "@mantine/spotlight";
import {ActionIcon, Box, Burger, Container, createStyles, Group, Header, Paper, Transition} from "@mantine/core";

const Search = ({mapRef}) => {
    const router = useRouter()
    if (router?.query?.overlay !== "false") return (
        <>{
            mapRef && <ActionIcon ml={"sm"}
                                  onClick={() => openSpotlight()}>
                                  <svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 0 24 24" width="36px" fill="#FFFFFF"><path d="M0 0h24v24H0z" fill="none"/><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg></ActionIcon>
        }</>
    );
    else return null;
}

export default Search

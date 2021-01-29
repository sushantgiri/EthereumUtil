pragma solidity ^0.7.0;

import { ECDSA } from "@openzeppelin/contracts/cryptography/ECDSA.sol";

contract Registry {
    using ECDSA for bytes32;

    struct Store {
        mapping(address=>uint256) statusDID;
        mapping(bytes32=>uint256) statusVC;
    }
    mapping(address=>Store) registry;
    mapping(bytes32=>bool) usedSigs;

    event DID(address indexed _issuer, address indexed _did, uint256 indexed _revokeCode);
    event VC(address indexed _issuer, bytes32 indexed _hash, uint256 indexed _revokeCode);

    function GetRevokeCodeDID(address _did, address _issuer) external view returns (uint256) {
        return registry[_issuer].statusDID[_did];
    }

    function _SetRevokeCodeDID(
        address _did,
        uint256 _revokeCode,
        uint256 _timestamp, // 재사용 방지를 위한 타임스템프
        address _issuer) internal returns (bool) {

        registry[_issuer].statusDID[_did] = _revokeCode;
        emit DID(_issuer, _did, _revokeCode);

        return true;
    }

    function SetRevokeCodeDID(
        address _did,
        uint256 _revokeCode,
        uint256 _nonce) external {
        require(_SetRevokeCodeDID(_did, _revokeCode, _nonce, msg.sender));
    }

    function GetRevokeCodeVC(bytes32 _hash, address _issuer) external view returns (uint256) {
        return registry[_issuer].statusVC[_hash];
    }

    function _SetRevokeCodeVC(
        bytes32 _hash,
        uint256 _revokeCode,
        uint256 _timestamp, // 재사용 방지를 위한 타임스템프
        address _issuer) internal returns (bool) {
        require(_revokeCode > 0 && registry[_issuer].statusVC[_hash] == 0);

        registry[_issuer].statusVC[_hash] = _revokeCode;
        emit VC(_issuer, _hash, _revokeCode);

        return true;
    }

    function SetRevokeCodeVC(
        bytes32 _hash,
        uint256 _revokeCode,
        uint256 _timestamp) external {
        require(_SetRevokeCodeVC(_hash, _revokeCode, _timestamp, msg.sender));
    }

    // MetaTx
    function verify(
        address _signer,
        bytes memory _sig,
        bytes memory _encodeWithSelector) private returns (bool) {
        bytes32 _hash = keccak256(_encodeWithSelector);
        require(!usedSigs[_hash]);
        require(_hash.toEthSignedMessageHash().recover(_sig) == _signer);
        usedSigs[_hash] = true;
        return true;
    }

    function isUsedTx(bytes32 _hash) external view returns (bool) {
        return usedSigs[_hash];
    }

    function SetRevokeCodeDID2(
        address _did,
        uint256 _revokeCode,
        uint256 _timestamp,
        address _signer,
        bytes memory _sig) external {
        // "14ea246d": "SetRevokeCodeDID(address,uint256,uint256)"
        bytes memory _encodeWithSelector = abi.encodeWithSelector(bytes4(0x14ea246d), _did, _revokeCode, _timestamp);
        require(verify(_signer, _sig, _encodeWithSelector));
        require(_SetRevokeCodeDID(_did, _revokeCode, _timestamp, _signer));
    }

    function SetRevokeCodeVC2(
        bytes32 _hash,
        uint256 _revokeCode,
        uint256 _timestamp,
        address _signer,
        bytes memory _sig) external {
        // "3d0e441a": "SetRevokeCodeVC(bytes32,uint256,uint256)",
        bytes memory _encodeWithSelector = abi.encodeWithSelector(bytes4(0x3d0e441a), _hash, _revokeCode, _timestamp);
        require(verify(_signer, _sig, _encodeWithSelector));
        require(_SetRevokeCodeVC(_hash, _revokeCode, _timestamp, _signer));
    }
}